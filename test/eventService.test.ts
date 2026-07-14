jest.mock('../src/data-source', () => ({
  AppDataSource: { getRepository: jest.fn() },
}));

import { AppDataSource } from '../src/data-source';
import { Contact } from '../src/entities/Contact';
import { Project } from '../src/entities/Project';
import { Tenant } from '../src/entities/Tenant';
import { BuildcoEvent, processEvent } from '../src/services/eventService';

const tenant = {
  id: 'tenant-1',
  name: 'Acme Construction',
  buildcoAccountId: 'acct-100',
  buildcoApiKey: 'key-100',
} as Tenant;

const projectRepo = {
  create: jest.fn((values: object) => values),
  save: jest.fn(async (values: object) => values),
  findOne: jest.fn(),
};
const contactRepo = {
  create: jest.fn((values: object) => values),
  save: jest.fn(async (values: object) => values),
  findOne: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
    if (entity === Project) return projectRepo;
    if (entity === Contact) return contactRepo;
    throw new Error('unexpected entity');
  });
});

describe('processEvent', () => {
  it('saves a contact from a contact.created event', async () => {
    const event: BuildcoEvent = {
      id: 'bc-cont-9',
      type: 'contact.created',
      occurred_at: '2024-06-18T10:00:00Z',
      data: { fullName: 'Dana Reyes', email: 'dana@example.com', role: 'foreman' },
    };

    await processEvent(tenant, event);

    expect(contactRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        externalId: 'bc-cont-9',
        fullName: 'Dana Reyes',
        email: 'dana@example.com',
        role: 'foreman',
      }),
    );
  });

  it('applies field changes from a project.updated event', async () => {
    projectRepo.findOne.mockResolvedValue({
      id: 'project-1',
      tenantId: 'tenant-1',
      externalId: 'bc-proj-1',
      name: 'Riverside Tower',
      status: 'active',
    });

    const event: BuildcoEvent = {
      id: 'bc-proj-1',
      type: 'project.updated',
      occurred_at: '2024-06-19T08:00:00Z',
      data: { name: 'Riverside Tower Phase 2', projectStatus: 'on_hold' },
    };

    await processEvent(tenant, event);

    expect(projectRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'project-1',
        name: 'Riverside Tower Phase 2',
        status: 'on_hold',
      }),
    );
  });
});
