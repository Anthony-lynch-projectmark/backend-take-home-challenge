import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1718700000000 implements MigrationInterface {
  name = 'InitialSchema1718700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "buildco_account_id" character varying NOT NULL,
        "buildco_api_key" character varying NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_tenants_buildco_account_id" UNIQUE ("buildco_account_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "external_id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'active',
        "site_address" text,
        "budget_cents" bigint,
        "source_updated_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_projects_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_projects_tenant_id" ON "projects" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_projects_external_id" ON "projects" ("external_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "contacts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "project_id" uuid,
        "external_id" character varying NOT NULL,
        "full_name" character varying NOT NULL,
        "email" character varying,
        "phone" character varying,
        "role" character varying,
        "source_updated_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_contacts_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id"),
        CONSTRAINT "fk_contacts_project" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_contacts_tenant_id" ON "contacts" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_contacts_external_id" ON "contacts" ("external_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "contacts"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
