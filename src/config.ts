import 'dotenv/config';

export interface AppConfig {
  port: number;
  databaseUrl: string;
  logLevel: string;
  buildco: {
    baseUrl: string;
    apiKey: string;
    webhookSecret: string;
  };
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgres://root:root@localhost:5432/buildco_sync',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  buildco: {
    baseUrl: process.env.BUILDCO_BASE_URL ?? 'https://api.buildco.example.com/v1',
    apiKey: process.env.BUILDCO_API_KEY ?? '',
    webhookSecret: process.env.BUILDCO_WEBHOOK_SECRET ?? '',
  },
};
