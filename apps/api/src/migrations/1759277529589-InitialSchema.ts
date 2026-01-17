import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1759277529589 implements MigrationInterface {
    name = 'InitialSchema1759277529589'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enums (with IF NOT EXISTS check)
        await queryRunner.query(`DO $$ BEGIN
            CREATE TYPE "public"."users_role_enum" AS ENUM('Owner', 'Admin', 'Viewer');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`);
        
        await queryRunner.query(`DO $$ BEGIN
            CREATE TYPE "public"."tasks_status_enum" AS ENUM('Backlog', 'InProgress', 'Done');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`);
        
        await queryRunner.query(`DO $$ BEGIN
            CREATE TYPE "public"."tasks_category_enum" AS ENUM('Work', 'Personal');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`);
        
        await queryRunner.query(`DO $$ BEGIN
            CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('CREATE', 'READ', 'UPDATE', 'DELETE');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`);

        // Create organizations table
        await queryRunner.query(`CREATE TABLE "organizations" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying(100) NOT NULL,
            "parentOrgId" uuid,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"),
            CONSTRAINT "UQ_organizations_parentorgid_name" UNIQUE ("parentOrgId", "name")
        )`);

        // Create users table
        await queryRunner.query(`CREATE TABLE "users" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "email" character varying(255) NOT NULL,
            "passwordHash" character varying(255) NOT NULL,
            "displayName" character varying(100) NOT NULL,
            "orgId" uuid NOT NULL,
            "role" "public"."users_role_enum" NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_users_email" UNIQUE ("email"),
            CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
        )`);

        // Create tasks table
        await queryRunner.query(`CREATE TABLE "tasks" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "title" character varying(100) NOT NULL,
            "description" text,
            "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'Backlog',
            "category" "public"."tasks_category_enum" NOT NULL DEFAULT 'Work',
            "createdByUserId" uuid,
            "orgId" uuid NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id")
        )`);

        // Create audit_logs table
        await queryRunner.query(`CREATE TABLE "audit_logs" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "userId" uuid NOT NULL,
            "action" "public"."audit_logs_action_enum" NOT NULL,
            "resourceType" character varying(50) NOT NULL,
            "resourceId" character varying(50) NOT NULL,
            "metadata" jsonb,
            "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "PK_2b6e5b7d4b7f3c9e7f3c9e7f3c9e" PRIMARY KEY ("id")
        )`);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_organizations_parentorgid_name" ON "organizations" ("parentOrgId", "name")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_orgid_role" ON "users" ("orgId", "role")`);
        await queryRunner.query(`CREATE INDEX "IDX_tasks_title" ON "tasks" ("title")`);
        await queryRunner.query(`CREATE INDEX "IDX_tasks_orgid_status" ON "tasks" ("orgId", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_tasks_orgid_updatedat" ON "tasks" ("orgId", "updatedAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_userid_timestamp" ON "audit_logs" ("userId", "timestamp")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_resourcetype_resourceid" ON "audit_logs" ("resourceType", "resourceId")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_action_timestamp" ON "audit_logs" ("action", "timestamp")`);

        // Create foreign key constraints
        await queryRunner.query(`ALTER TABLE "organizations" ADD CONSTRAINT "FK_organizations_parentorgid" FOREIGN KEY ("parentOrgId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_orgid" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_orgid" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_createdbyuserid" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_userid" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_userid"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_createdbyuserid"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_orgid"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_orgid"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP CONSTRAINT "FK_organizations_parentorgid"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_action_timestamp"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_resourcetype_resourceid"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_userid_timestamp"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_orgid_updatedat"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_orgid_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_title"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_orgid_role"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_organizations_parentorgid_name"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "organizations"`);

        // Drop enums (with IF EXISTS check)
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."audit_logs_action_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."tasks_category_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."tasks_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);
    }

}
