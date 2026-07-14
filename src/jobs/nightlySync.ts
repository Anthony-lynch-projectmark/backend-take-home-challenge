import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Tenant } from '../entities/Tenant';
import { logger } from '../logger';
import { syncTenant } from '../services/reconcileService';

async function main(): Promise<void> {
  await AppDataSource.initialize();
  const tenants = await AppDataSource.getRepository(Tenant).find();
  logger.info({ tenantCount: tenants.length }, 'starting nightly sync');

  for (const tenant of tenants) {
    const summary = await syncTenant(tenant);
    logger.info(
      {
        tenantId: tenant.id,
        projectsUpserted: summary.projectsUpserted,
        contactsUpserted: summary.contactsUpserted,
      },
      'tenant sync finished',
    );
  }

  await AppDataSource.destroy();
}

main().catch((err) => {
  logger.error({ err }, 'nightly sync failed');
  process.exit(1);
});
