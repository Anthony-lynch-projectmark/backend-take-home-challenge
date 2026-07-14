import 'reflect-metadata';
import { createApp } from './app';
import { config } from './config';
import { AppDataSource } from './data-source';
import { logger } from './logger';

async function start(): Promise<void> {
  await AppDataSource.initialize();
  const app = createApp();
  app.listen(config.port, () => {
    logger.info({ port: config.port }, 'buildco-sync listening');
  });
}

start().catch((err) => {
  logger.error({ err }, 'failed to start service');
  process.exit(1);
});
