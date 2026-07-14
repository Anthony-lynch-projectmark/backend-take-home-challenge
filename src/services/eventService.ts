import { AppDataSource } from '../data-source';
import { Contact } from '../entities/Contact';
import { Project } from '../entities/Project';
import { Tenant } from '../entities/Tenant';
import { logger } from '../logger';

export type BuildcoEventType =
  | 'project.created'
  | 'project.updated'
  | 'contact.created'
  | 'contact.updated';

export interface BuildcoEvent {
  id: string;
  type: BuildcoEventType;
  occurred_at: string;
  data: Record<string, unknown>;
}

interface ProjectPayload {
  name?: string;
  projectStatus?: string;
  site_address?: string | null;
  budget_cents?: number | null;
  contacts?: ContactPayload[];
}

interface ContactPayload {
  id?: string;
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  project_id?: string;
}

export async function processEvent(tenant: Tenant, event: BuildcoEvent): Promise<void> {
  switch (event.type) {
    case 'project.created':
      await applyProjectCreated(tenant, event);
      break;
    case 'project.updated':
      await applyProjectUpdated(tenant, event);
      break;
    case 'contact.created':
      await applyContactCreated(tenant, event);
      break;
    case 'contact.updated':
      await applyContactUpdated(tenant, event);
      break;
  }
}

async function applyProjectCreated(tenant: Tenant, event: BuildcoEvent): Promise<void> {
  const projectRepo = AppDataSource.getRepository(Project);
  const contactRepo = AppDataSource.getRepository(Contact);
  const data = event.data as ProjectPayload;

  const project = projectRepo.create({
    tenantId: tenant.id,
    externalId: event.id,
    name: data.name ?? '',
    status: data.projectStatus ?? 'active',
    siteAddress: data.site_address ?? null,
    budgetCents: data.budget_cents != null ? String(data.budget_cents) : null,
    sourceUpdatedAt: new Date(event.occurred_at),
  });
  const saved = await projectRepo.save(project);

  const embedded = data.contacts ?? [];
  for (const payload of embedded) {
    const contact = contactRepo.create({
      tenantId: tenant.id,
      projectId: saved.id,
      externalId: payload.id ?? '',
      fullName: payload.fullName ?? '',
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      role: payload.role ?? null,
      sourceUpdatedAt: new Date(event.occurred_at),
    });
    await contactRepo.save(contact);
  }
}

async function applyProjectUpdated(tenant: Tenant, event: BuildcoEvent): Promise<void> {
  const projectRepo = AppDataSource.getRepository(Project);
  const project = await projectRepo.findOne({ where: { externalId: event.id } });
  if (!project) {
    logger.warn(
      { tenantId: tenant.id, externalId: event.id },
      'project.updated received for unknown project, skipping',
    );
    return;
  }

  const data = event.data as ProjectPayload;
  if (data.name !== undefined) {
    project.name = data.name;
  }
  if (data.projectStatus !== undefined) {
    project.status = data.projectStatus;
  }
  if (data.site_address !== undefined) {
    project.siteAddress = data.site_address;
  }
  if (data.budget_cents !== undefined) {
    project.budgetCents = data.budget_cents != null ? String(data.budget_cents) : null;
  }
  project.sourceUpdatedAt = new Date(event.occurred_at);
  await projectRepo.save(project);
}

async function applyContactCreated(tenant: Tenant, event: BuildcoEvent): Promise<void> {
  const contactRepo = AppDataSource.getRepository(Contact);
  const data = event.data as ContactPayload;

  let projectId: string | null = null;
  if (data.project_id) {
    const projectRepo = AppDataSource.getRepository(Project);
    const project = await projectRepo.findOne({
      where: { tenantId: tenant.id, externalId: data.project_id },
    });
    projectId = project ? project.id : null;
  }

  const contact = contactRepo.create({
    tenantId: tenant.id,
    projectId,
    externalId: event.id,
    fullName: data.fullName ?? '',
    email: data.email ?? null,
    phone: data.phone ?? null,
    role: data.role ?? null,
    sourceUpdatedAt: new Date(event.occurred_at),
  });
  await contactRepo.save(contact);
}

async function applyContactUpdated(tenant: Tenant, event: BuildcoEvent): Promise<void> {
  const contactRepo = AppDataSource.getRepository(Contact);
  const contact = await contactRepo.findOne({ where: { externalId: event.id } });
  if (!contact) {
    logger.warn(
      { tenantId: tenant.id, externalId: event.id },
      'contact.updated received for unknown contact, skipping',
    );
    return;
  }

  const data = event.data as ContactPayload;
  if (data.fullName !== undefined) {
    contact.fullName = data.fullName;
  }
  if (data.email !== undefined) {
    contact.email = data.email;
  }
  if (data.phone !== undefined) {
    contact.phone = data.phone;
  }
  if (data.role !== undefined) {
    contact.role = data.role;
  }
  contact.sourceUpdatedAt = new Date(event.occurred_at);
  await contactRepo.save(contact);
}
