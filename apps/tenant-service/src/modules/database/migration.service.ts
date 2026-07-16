import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

@Injectable()
export class MigrationService implements OnModuleInit {
  constructor(
    @Inject('DATABASE_PUBLIC') private readonly publicDb: NodePgDatabase<any>,
  ) {}

  async onModuleInit() {
    console.log('🔄 Running database migrations...');
    try {
      // 1. Create audit_logs in public schema if not exists
      await this.publicDb.execute(sql`
        CREATE TABLE IF NOT EXISTS "audit_logs" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "user_id" uuid,
          "tenant_id" uuid,
          "action" varchar(100) NOT NULL,
          "entity" varchar(100),
          "entity_id" varchar(100),
          "ip_address" varchar(45),
          "user_agent" text,
          "created_at" timestamp DEFAULT now() NOT NULL
        );
      `);
      console.log('✅ Public audit_logs table verified.');

      // 2. Fetch all tenants
      const tenantsResult = await this.publicDb.execute(sql`
        SELECT "schema_name" FROM "tenants";
      `);

      for (const tenant of tenantsResult.rows) {
        const schemaName = tenant.schema_name as string;
        console.log(`\n⏳ Migrating schema: ${schemaName}...`);

        // Create designations
        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."designations" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "name" varchar(100) NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        // Create departments
        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."departments" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "name" varchar(100) NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        // Create employees
        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."employees" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "employee_code" varchar(50) UNIQUE NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        // Create roles (legacy table)
        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."roles" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "name" varchar(50) UNIQUE NOT NULL,
            "permissions" text[] NOT NULL DEFAULT '{}',
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        // Create users table if not exists
        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."users" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "email" varchar(255) UNIQUE NOT NULL,
            "password" varchar(255) NOT NULL,
            "role_id" uuid REFERENCES "${schemaName}"."roles"("id") ON DELETE SET NULL,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        // Idempotently add missing columns to users
        await this.publicDb.execute(sql.raw(`
          ALTER TABLE "${schemaName}"."users" 
          ADD COLUMN IF NOT EXISTS "profile_photo_url" text,
          ADD COLUMN IF NOT EXISTS "designation_id" uuid REFERENCES "${schemaName}"."designations"("id") ON DELETE SET NULL,
          ADD COLUMN IF NOT EXISTS "department_id" uuid REFERENCES "${schemaName}"."departments"("id") ON DELETE SET NULL,
          ADD COLUMN IF NOT EXISTS "employee_id" uuid REFERENCES "${schemaName}"."employees"("id") ON DELETE SET NULL,
          ADD COLUMN IF NOT EXISTS "phone" varchar(20),
          ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL,
          ADD COLUMN IF NOT EXISTS "last_login" timestamp,
          ADD COLUMN IF NOT EXISTS "created_by" uuid,
          ADD COLUMN IF NOT EXISTS "updated_by" uuid;
        `));

        // Create permissions table
        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."permissions" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "code" varchar(100) UNIQUE NOT NULL,
            "name" varchar(100) NOT NULL,
            "module" varchar(100) NOT NULL,
            "description" text,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        // Create role_permissions table
        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."role_permissions" (
            "role_id" uuid REFERENCES "${schemaName}"."roles"("id") ON DELETE CASCADE,
            "permission_id" uuid REFERENCES "${schemaName}"."permissions"("id") ON DELETE CASCADE,
            PRIMARY KEY ("role_id", "permission_id")
          );
        `));

        // Create user_roles table
        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."user_roles" (
            "user_id" uuid REFERENCES "${schemaName}"."users"("id") ON DELETE CASCADE,
            "role_id" uuid REFERENCES "${schemaName}"."roles"("id") ON DELETE CASCADE,
            PRIMARY KEY ("user_id", "role_id")
          );
        `));

        // Seed default permissions
        const defaultPermissions = [
          { code: 'user:create', name: 'Create User', module: 'user', description: 'Create system users' },
          { code: 'user:view', name: 'View User', module: 'user', description: 'View system users' },
          { code: 'user:update', name: 'Update User', module: 'user', description: 'Update system users' },
          { code: 'user:delete', name: 'Delete User', module: 'user', description: 'Delete system users' },
          { code: 'item:create', name: 'Create Item', module: 'item', description: 'Create inventory items' },
          { code: 'item:view', name: 'View Item', module: 'item', description: 'View inventory items' },
          { code: 'item:update', name: 'Update Item', module: 'item', description: 'Update inventory items' },
          { code: 'purchase:create', name: 'Create Purchase', module: 'purchase', description: 'Create purchase orders' },
          { code: 'purchase:approve', name: 'Approve Purchase', module: 'purchase', description: 'Approve purchase orders' },
          { code: 'sales:create', name: 'Create Sales', module: 'sales', description: 'Create sales orders' },
          { code: 'production:create', name: 'Create Production', module: 'production', description: 'Create production batches' },
          { code: 'lead:create', name: 'Create Lead', module: 'marketing', description: 'Create CRM leads' },
          { code: 'lead:view', name: 'View Lead', module: 'marketing', description: 'View CRM leads' },
          { code: 'lead:update', name: 'Update Lead', module: 'marketing', description: 'Update CRM leads' },
          { code: 'customer:create', name: 'Create Customer', module: 'marketing', description: 'Create CRM customers' },
          { code: 'customer:view', name: 'View Customer', module: 'marketing', description: 'View CRM customers' },
          { code: 'quotation:create', name: 'Create Quotation', module: 'marketing', description: 'Create quotations' },
          { code: 'quotation:approve', name: 'Approve Quotation', module: 'marketing', description: 'Approve/Update quotations' },
          { code: 'product:create', name: 'Create Product', module: 'marketing', description: 'Manage product catalogue' },
          { code: 'dashboard:view', name: 'View CRM Dashboard', module: 'marketing', description: 'View Executive Dashboard and reports' },
        ];

        for (const p of defaultPermissions) {
          await this.publicDb.execute(sql`
            INSERT INTO ${sql.raw(`"${schemaName}"."permissions"`)} ("code", "name", "module", "description")
            VALUES (${p.code}, ${p.name}, ${p.module}, ${p.description})
            ON CONFLICT ("code") DO NOTHING
          `);
        }

        // Map legacy role permissions to role_permissions table
        const allRolesResult = await this.publicDb.execute(sql.raw(`
          SELECT "id", "name", "permissions" FROM "${schemaName}"."roles"
        `));
        for (const roleRow of allRolesResult.rows) {
          const legacyPerms = roleRow.permissions as string[];
          if (!legacyPerms || legacyPerms.length === 0) continue;

          if (legacyPerms.includes('*')) {
            // Map all permissions to this role
            const allPerms = await this.publicDb.execute(sql.raw(`
              SELECT "id" FROM "${schemaName}"."permissions"
            `));
            for (const permRow of allPerms.rows) {
              await this.publicDb.execute(sql.raw(`
                INSERT INTO "${schemaName}"."role_permissions" ("role_id", "permission_id")
                VALUES ('${roleRow.id}', '${permRow.id}')
                ON CONFLICT DO NOTHING
              `));
            }
          } else {
            // Map specific permissions to this role
            for (const code of legacyPerms) {
              const permResult = await this.publicDb.execute(sql.raw(`
                SELECT "id" FROM "${schemaName}"."permissions" WHERE "code" = '${code.replace(/'/g, "''")}'
              `));
              if (permResult.rows.length > 0) {
                await this.publicDb.execute(sql.raw(`
                  INSERT INTO "${schemaName}"."role_permissions" ("role_id", "permission_id")
                  VALUES ('${roleRow.id}', '${permResult.rows[0].id}')
                  ON CONFLICT DO NOTHING
                `));
              }
            }
          }
        }

        // Migrate existing legacy users roleIds to user_roles
        const usersResult = await this.publicDb.execute(sql.raw(`
          SELECT "id", "role_id" FROM "${schemaName}"."users" WHERE "role_id" IS NOT NULL
        `));
        for (const userRow of usersResult.rows) {
          await this.publicDb.execute(sql.raw(`
            INSERT INTO "${schemaName}"."user_roles" ("user_id", "role_id")
            VALUES ('${userRow.id}', '${userRow.role_id}')
            ON CONFLICT DO NOTHING
          `));
        }

        // ==========================================
        // Create Marketing & CRM Tables
        // ==========================================

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."sales_teams" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "team_name" varchar(100) UNIQUE NOT NULL,
            "description" text,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."sales_targets" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "user_id" uuid,
            "team_id" uuid REFERENCES "${schemaName}"."sales_teams"("id") ON DELETE CASCADE NOT NULL,
            "target_value" decimal(12,2) NOT NULL,
            "month" integer NOT NULL,
            "year" integer NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."sales_team_members" (
            "team_id" uuid REFERENCES "${schemaName}"."sales_teams"("id") ON DELETE CASCADE NOT NULL,
            "user_id" uuid REFERENCES "${schemaName}"."users"("id") ON DELETE CASCADE NOT NULL,
            "designation" varchar(50) NOT NULL,
            PRIMARY KEY ("team_id", "user_id")
          );
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."zones" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "zone_code" varchar(50) UNIQUE NOT NULL,
            "zone_name" varchar(100) NOT NULL,
            "description" text,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."regions" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "zone_id" uuid REFERENCES "${schemaName}"."zones"("id") ON DELETE CASCADE NOT NULL,
            "region_code" varchar(50) UNIQUE NOT NULL,
            "region_name" varchar(100) NOT NULL,
            "description" text,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."lead_statuses" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "code" varchar(50) UNIQUE NOT NULL,
            "name" varchar(100) NOT NULL,
            "status_order" integer NOT NULL,
            "is_won" boolean DEFAULT false NOT NULL,
            "is_drop" boolean DEFAULT false NOT NULL,
            "description" text,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."leads" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "lead_no" varchar(50) UNIQUE NOT NULL,
            "company_name" varchar(255),
            "contact_person" varchar(255),
            "mobile" varchar(20),
            "alternate_mobile" varchar(20),
            "email" varchar(255),
            "address1" text,
            "address2" text,
            "city" varchar(100),
            "district" varchar(100),
            "state" varchar(100),
            "country" varchar(100),
            "pincode" varchar(20),
            "latitude" decimal(10,8),
            "longitude" decimal(11,8),
            "source" varchar(100),
            "website" varchar(255),
            "industry" varchar(100),
            "lead_status_id" uuid REFERENCES "${schemaName}"."lead_statuses"("id") ON DELETE SET NULL,
            "lead_score" integer DEFAULT 0 NOT NULL,
            "remarks" text,
            "assigned_to" uuid REFERENCES "${schemaName}"."users"("id") ON DELETE SET NULL,
            "team_id" uuid REFERENCES "${schemaName}"."sales_teams"("id") ON DELETE SET NULL,
            "zone_id" uuid REFERENCES "${schemaName}"."zones"("id") ON DELETE SET NULL,
            "region_id" uuid REFERENCES "${schemaName}"."regions"("id") ON DELETE SET NULL,
            "expected_value" decimal(12,2),
            "expected_closing_date" timestamp,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."products" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "product_code" varchar(50) UNIQUE NOT NULL,
            "product_name" varchar(100) NOT NULL,
            "category" varchar(100),
            "description" text,
            "uom" varchar(20),
            "is_active" boolean DEFAULT true NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."lead_products" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "lead_id" uuid REFERENCES "${schemaName}"."leads"("id") ON DELETE CASCADE NOT NULL,
            "product_id" uuid REFERENCES "${schemaName}"."products"("id") ON DELETE CASCADE NOT NULL,
            "quantity" integer NOT NULL,
            "unit_price" decimal(12,2) NOT NULL,
            "amount" decimal(12,2) NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."lead_number_settings" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "prefix" varchar(10) DEFAULT 'LD' NOT NULL,
            "current_sequence" integer DEFAULT 1 NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."customers" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "customer_code" varchar(50) UNIQUE NOT NULL,
            "company_name" varchar(255) NOT NULL,
            "contact_person" varchar(255),
            "mobile" varchar(20),
            "email" varchar(255),
            "billing_address" text,
            "shipping_address" text,
            "city" varchar(100),
            "district" varchar(100),
            "state" varchar(100),
            "country" varchar(100),
            "pincode" varchar(20),
            "latitude" decimal(10,8),
            "longitude" decimal(11,8),
            "gst_no" varchar(20),
            "pan_no" varchar(20),
            "credit_limit" decimal(12,2),
            "remarks" text,
            "customer_type" varchar(50),
            "status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."product_prices" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "product_id" uuid REFERENCES "${schemaName}"."products"("id") ON DELETE CASCADE NOT NULL,
            "pricing_type" varchar(50) DEFAULT 'UNIT' NOT NULL,
            "min_count" integer NOT NULL,
            "max_count" integer NOT NULL,
            "unit_price" decimal(12,2),
            "fixed_amount" decimal(12,2),
            "currency" varchar(10) DEFAULT 'INR' NOT NULL,
            "effective_from" timestamp NOT NULL,
            "effective_to" timestamp NOT NULL,
            "status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL,
            "created_by" uuid,
            "updated_by" uuid
          );
        `));

        // Schema migration updates for existing product_prices tables
        await this.publicDb.execute(sql.raw(`
          ALTER TABLE "${schemaName}"."product_prices"
          ADD COLUMN IF NOT EXISTS "pricing_type" varchar(50) DEFAULT 'UNIT' NOT NULL,
          ADD COLUMN IF NOT EXISTS "min_count" integer,
          ADD COLUMN IF NOT EXISTS "max_count" integer,
          ADD COLUMN IF NOT EXISTS "fixed_amount" decimal(12,2),
          ADD COLUMN IF NOT EXISTS "currency" varchar(10) DEFAULT 'INR' NOT NULL,
          ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
          ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL,
          ADD COLUMN IF NOT EXISTS "created_by" uuid,
          ADD COLUMN IF NOT EXISTS "updated_by" uuid;
        `));

        // Copy legacy minimum_qty and maximum_qty if existing and not null
        await this.publicDb.execute(sql.raw(`
          UPDATE "${schemaName}"."product_prices"
          SET "min_count" = "minimum_qty"
          WHERE "min_count" IS NULL AND "minimum_qty" IS NOT NULL;
        `));
        await this.publicDb.execute(sql.raw(`
          UPDATE "${schemaName}"."product_prices"
          SET "max_count" = "maximum_qty"
          WHERE "max_count" IS NULL AND "maximum_qty" IS NOT NULL;
        `));

        // Ensure NOT NULL constraints for min_count and max_count
        await this.publicDb.execute(sql.raw(`
          ALTER TABLE "${schemaName}"."product_prices"
          ALTER COLUMN "min_count" SET NOT NULL,
          ALTER COLUMN "max_count" SET NOT NULL;
        `));

        // Drop NOT NULL from unit_price since it's nullable for FIXED pricing
        await this.publicDb.execute(sql.raw(`
          ALTER TABLE "${schemaName}"."product_prices"
          ALTER COLUMN "unit_price" DROP NOT NULL;
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."quotations" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "quotation_no" varchar(50) UNIQUE NOT NULL,
            "lead_id" uuid REFERENCES "${schemaName}"."leads"("id") ON DELETE SET NULL,
            "customer_id" uuid REFERENCES "${schemaName}"."customers"("id") ON DELETE SET NULL,
            "quote_date" timestamp DEFAULT now() NOT NULL,
            "valid_until" timestamp,
            "subtotal" decimal(12,2) NOT NULL,
            "discount" decimal(12,2) DEFAULT 0.00 NOT NULL,
            "tax_amount" decimal(12,2) DEFAULT 0.00 NOT NULL,
            "total_amount" decimal(12,2) NOT NULL,
            "status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."quotation_items" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "quotation_id" uuid REFERENCES "${schemaName}"."quotations"("id") ON DELETE CASCADE NOT NULL,
            "product_id" uuid REFERENCES "${schemaName}"."products"("id") NOT NULL,
            "quantity" integer NOT NULL,
            "rate" decimal(12,2) NOT NULL,
            "amount" decimal(12,2) NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."activities" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "lead_id" uuid REFERENCES "${schemaName}"."leads"("id") ON DELETE CASCADE,
            "customer_id" uuid REFERENCES "${schemaName}"."customers"("id") ON DELETE CASCADE,
            "type" varchar(50) NOT NULL,
            "activity_date" timestamp DEFAULT now() NOT NULL,
            "next_followup_date" timestamp,
            "remarks" text,
            "created_by" uuid REFERENCES "${schemaName}"."users"("id") ON DELETE SET NULL,
            "status" varchar(50) DEFAULT 'OPEN' NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."attachments" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "entity_type" varchar(50) NOT NULL,
            "entity_id" uuid NOT NULL,
            "file_name" varchar(255) NOT NULL,
            "file_url" text NOT NULL,
            "file_size" integer,
            "content_type" varchar(100),
            "uploaded_by" uuid REFERENCES "${schemaName}"."users"("id") ON DELETE SET NULL,
            "uploaded_at" timestamp DEFAULT now() NOT NULL
          );
        `));

        // Create companies table
        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."companies" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "company_code" varchar(50) UNIQUE NOT NULL,
            "company_name" varchar(255) NOT NULL,
            "email" varchar(255),
            "phone" varchar(50),
            "website" varchar(255),
            "is_active" boolean DEFAULT true NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL,
            "created_by" uuid,
            "updated_by" uuid
          );
        `));

        // Create lead_sources table
        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."lead_sources" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "code" varchar(50) UNIQUE NOT NULL,
            "name" varchar(255) NOT NULL,
            "is_active" boolean DEFAULT true NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL,
            "created_by" uuid,
            "updated_by" uuid
          );
        `));

        // Create industries table
        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."industries" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "code" varchar(50) UNIQUE NOT NULL,
            "name" varchar(255) NOT NULL,
            "is_active" boolean DEFAULT true NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL,
            "created_by" uuid,
            "updated_by" uuid
          );
        `));

        // Create quotation_revisions table
        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."quotation_revisions" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "quotation_id" uuid REFERENCES "${schemaName}"."quotations"("id") ON DELETE CASCADE NOT NULL,
            "revision_no" varchar(50) NOT NULL,
            "subtotal" decimal(12,2) NOT NULL,
            "discount" decimal(12,2) DEFAULT 0.00 NOT NULL,
            "tax_amount" decimal(12,2) DEFAULT 0.00 NOT NULL,
            "total_amount" decimal(12,2) NOT NULL,
            "status" varchar(50) NOT NULL,
            "terms" text,
            "notes" text,
            "items_snapshot" text NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "created_by" uuid
          );
        `));

        // Create quotation_history table
        await this.publicDb.execute(sql.raw(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."quotation_history" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "quotation_id" uuid REFERENCES "${schemaName}"."quotations"("id") ON DELETE CASCADE NOT NULL,
            "revision_no" varchar(50) NOT NULL,
            "status" varchar(50) NOT NULL,
            "remarks" text,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "created_by" uuid
          );
        `));

        // Alter quotations table columns
        await this.publicDb.execute(sql.raw(`
          ALTER TABLE "${schemaName}"."quotations" ADD COLUMN IF NOT EXISTS "revision_no" varchar(50) DEFAULT 'R0' NOT NULL;
          ALTER TABLE "${schemaName}"."quotations" ADD COLUMN IF NOT EXISTS "terms" text;
          ALTER TABLE "${schemaName}"."quotations" ADD COLUMN IF NOT EXISTS "notes" text;
          ALTER TABLE "${schemaName}"."quotations" ADD COLUMN IF NOT EXISTS "prepared_by" uuid REFERENCES "${schemaName}"."users"("id") ON DELETE SET NULL;
          ALTER TABLE "${schemaName}"."quotations" ADD COLUMN IF NOT EXISTS "approved_by" uuid REFERENCES "${schemaName}"."users"("id") ON DELETE SET NULL;
          ALTER TABLE "${schemaName}"."quotations" ADD COLUMN IF NOT EXISTS "signature" text;
        `));

        // Seeding default Lead Statuses
        const statusesCount = await this.publicDb.execute(sql.raw(`
          SELECT COUNT(*) FROM "${schemaName}"."lead_statuses";
        `));

        if (parseInt(statusesCount.rows[0].count as string, 10) === 0) {
          const defaultStatuses = [
            { code: 'NEW', name: 'New', order: 1, isWon: false, isDrop: false },
            { code: 'CONTACTED', name: 'Contacted', order: 2, isWon: false, isDrop: false },
            { code: 'FOLLOWUP', name: 'Follow-up', order: 3, isWon: false, isDrop: false },
            { code: 'QUALIFIED', name: 'Qualified', order: 4, isWon: false, isDrop: false },
            { code: 'DISQUALIFIED', name: 'Disqualified', order: 5, isWon: false, isDrop: true },
            { code: 'NEGOTIATION', name: 'Negotiation', order: 6, isWon: false, isDrop: false },
            { code: 'QUOTATION_SENT', name: 'Quotation Sent', order: 7, isWon: false, isDrop: false },
            { code: 'WON', name: 'Won', order: 8, isWon: true, isDrop: false },
            { code: 'LOST', name: 'Lost', order: 9, isWon: false, isDrop: true },
            { code: 'NO_GO', name: 'No Go', order: 10, isWon: false, isDrop: true },
          ];

          for (const s of defaultStatuses) {
            await this.publicDb.execute(sql.raw(`
              INSERT INTO "${schemaName}"."lead_statuses" (code, name, status_order, is_won, is_drop)
              VALUES ('${s.code}', '${s.name}', ${s.order}, ${s.isWon}, ${s.isDrop});
            `));
          }
          console.log(`✅ Default lead statuses seeded for ${schemaName}`);
        }

        // Seeding default Lead Number Settings
        const settingsCount = await this.publicDb.execute(sql.raw(`
          SELECT COUNT(*) FROM "${schemaName}"."lead_number_settings";
        `));

        if (parseInt(settingsCount.rows[0].count as string, 10) === 0) {
          await this.publicDb.execute(sql.raw(`
            INSERT INTO "${schemaName}"."lead_number_settings" (prefix, current_sequence)
            VALUES ('LD', 1);
          `));
          console.log(`✅ Lead number settings initialized for ${schemaName}`);
        }

        // Seed default Lead Sources
        const leadSourcesCountResult = await this.publicDb.execute(sql.raw(`
          SELECT COUNT(*) FROM "${schemaName}"."lead_sources";
        `));
        if (parseInt(leadSourcesCountResult.rows[0].count as string, 10) === 0) {
          const defaultSources = [
            { code: 'website', name: 'Website' },
            { code: 'facebook', name: 'Facebook' },
            { code: 'instagram', name: 'Instagram' },
            { code: 'referral', name: 'Referral' },
            { code: 'cold-call', name: 'Cold Call' },
            { code: 'whatsapp', name: 'WhatsApp' },
            { code: 'campaign', name: 'Campaign' },
            { code: 'exhibition', name: 'Exhibition' },
          ];
          for (const s of defaultSources) {
            await this.publicDb.execute(sql.raw(`
              INSERT INTO "${schemaName}"."lead_sources" (code, name)
              VALUES ('${s.code}', '${s.name}')
              ON CONFLICT ("code") DO NOTHING;
            `));
          }
          console.log(`✅ Lead sources seeded for ${schemaName}`);
        }

        // Seed default Industries
        const industriesCountResult = await this.publicDb.execute(sql.raw(`
          SELECT COUNT(*) FROM "${schemaName}"."industries";
        `));
        if (parseInt(industriesCountResult.rows[0].count as string, 10) === 0) {
          const defaultIndustries = [
            { code: 'school', name: 'School' },
            { code: 'college', name: 'College' },
            { code: 'university', name: 'University' },
            { code: 'hospital', name: 'Hospital' },
            { code: 'manufacturing', name: 'Manufacturing' },
            { code: 'retail', name: 'Retail' },
            { code: 'software', name: 'Software' },
            { code: 'finance', name: 'Finance' },
          ];
          for (const ind of defaultIndustries) {
            await this.publicDb.execute(sql.raw(`
              INSERT INTO "${schemaName}"."industries" (code, name)
              VALUES ('${ind.code}', '${ind.name}')
              ON CONFLICT ("code") DO NOTHING;
            `));
          }
          console.log(`✅ Industries seeded for ${schemaName}`);
        }

        // Seed default Products and Pricing Slabs
        const prodCountResult = await this.publicDb.execute(sql.raw(`
          SELECT COUNT(*) FROM "${schemaName}"."products";
        `));
        if (parseInt(prodCountResult.rows[0].count as string, 10) === 0) {
          const defaultProducts = [
            { code: 'school-erp', name: 'School ERP', category: 'ERP', desc: 'School Management System' },
            { code: 'college-erp', name: 'College ERP', category: 'ERP', desc: 'College Management System' },
            { code: 'hrms', name: 'HRMS', category: 'HR', desc: 'Human Resource Management System' },
            { code: 'crm', name: 'CRM', category: 'CRM', desc: 'Customer Relationship Management' },
            { code: 'lms', name: 'LMS', category: 'LMS', desc: 'Learning Management System' },
            { code: 'hostel', name: 'Hostel', category: 'Addon', desc: 'Hostel Management' },
            { code: 'transport', name: 'Transport', category: 'Addon', desc: 'Transport Management' }
          ];
          for (const p of defaultProducts) {
            const result = await this.publicDb.execute(sql.raw(`
              INSERT INTO "${schemaName}"."products" (product_code, product_name, category, description)
              VALUES ('${p.code}', '${p.name}', '${p.category}', '${p.desc}')
              RETURNING id;
            `));
            const productId = result.rows[0].id;
            
            const now = new Date().toISOString();
            const future = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
            if (p.code === 'school-erp') {
              const slabs = [
                { min: 1, max: 1000, price: 20000 },
                { min: 1001, max: 2000, price: 35000 },
                { min: 2001, max: 4000, price: 55000 },
                { min: 4001, max: 6000, price: 80000 }
              ];
              for (const slab of slabs) {
                await this.publicDb.execute(sql.raw(`
                  INSERT INTO "${schemaName}"."product_prices" (product_id, pricing_type, min_count, max_count, fixed_amount, unit_price, effective_from, effective_to)
                  VALUES ('${productId}', 'FIXED', ${slab.min}, ${slab.max}, ${slab.price}, NULL, '${now}', '${future}');
                `));
              }
            } else if (p.code === 'college-erp') {
              const slabs = [
                { min: 1, max: 2000, price: 40000 },
                { min: 2001, max: 5000, price: 70000 },
                { min: 5001, max: 999999, price: 100000 }
              ];
              for (const slab of slabs) {
                await this.publicDb.execute(sql.raw(`
                  INSERT INTO "${schemaName}"."product_prices" (product_id, pricing_type, min_count, max_count, fixed_amount, unit_price, effective_from, effective_to)
                  VALUES ('${productId}', 'FIXED', ${slab.min}, ${slab.max}, ${slab.price}, NULL, '${now}', '${future}');
                `));
              }
            } else if (p.code === 'crm') {
              const slabs = [
                { min: 1, max: 1000, price: 20 },
                { min: 1001, max: 2000, price: 18 },
                { min: 2001, max: 4000, price: 15 }
              ];
              for (const slab of slabs) {
                await this.publicDb.execute(sql.raw(`
                  INSERT INTO "${schemaName}"."product_prices" (product_id, pricing_type, min_count, max_count, unit_price, fixed_amount, effective_from, effective_to)
                  VALUES ('${productId}', 'UNIT', ${slab.min}, ${slab.max}, ${slab.price}, NULL, '${now}', '${future}');
                `));
              }
            } else if (p.code === 'hrms') {
              const slabs = [
                { min: 1, max: 1000, price: 25 },
                { min: 1001, max: 2000, price: 22 },
                { min: 2001, max: 4000, price: 20 }
              ];
              for (const slab of slabs) {
                await this.publicDb.execute(sql.raw(`
                  INSERT INTO "${schemaName}"."product_prices" (product_id, pricing_type, min_count, max_count, unit_price, fixed_amount, effective_from, effective_to)
                  VALUES ('${productId}', 'UNIT', ${slab.min}, ${slab.max}, ${slab.price}, NULL, '${now}', '${future}');
                `));
              }
            } else {
              await this.publicDb.execute(sql.raw(`
                INSERT INTO "${schemaName}"."product_prices" (product_id, pricing_type, min_count, max_count, fixed_amount, unit_price, effective_from, effective_to)
                VALUES ('${productId}', 'FIXED', 1, 999999, 15000, NULL, '${now}', '${future}');
              `));
            }
          }
          console.log(`✅ Products and pricing slabs seeded for ${schemaName}`);
        }

        console.log(`✅ Schema ${schemaName} migrated successfully.`);
      }

      console.log('✅ Database migrations completed successfully.');
    } catch (err) {
      console.error('❌ Database migration failed:', err);
    }
  }
}
