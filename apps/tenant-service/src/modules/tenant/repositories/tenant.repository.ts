import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { tenants, plans, subscriptions, Tenant, NewTenant, NewSubscription } from '../../database/schemas/public.schema';
import { users, roles } from '../../database/schemas/tenant.schema';
import { TenantContext } from '../../common/context/tenant.context';

@Injectable()
export class TenantRepository {
  constructor(
    @Inject('DATABASE_PUBLIC') private readonly publicDb: NodePgDatabase<any>,
  ) { }

  // ==========================================
  // Public Schema Queries (Always use publicDb)
  // ==========================================

  async findTenantByCode(tenantCode: string): Promise<Tenant | null> {
    const results = await this.publicDb
      .select()
      .from(tenants)
      .where(eq(tenants.tenantCode, tenantCode))
      .limit(1);
    return results[0] || null;
  }

  async findTenantByEmail(email: string): Promise<Tenant | null> {
    const results = await this.publicDb
      .select()
      .from(tenants)
      .where(eq(tenants.email, email))
      .limit(1);
    return results[0] || null;
  }

  async createTenant(tenantData: NewTenant): Promise<Tenant> {
    const results = await this.publicDb
      .insert(tenants)
      .values(tenantData)
      .returning();
    return results[0];
  }

  async updateTenant(id: string, tenantData: Partial<Tenant>): Promise<Tenant> {
    const results = await this.publicDb
      .update(tenants)
      .set({ ...tenantData, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return results[0];
  }

  async findPlanByCode(code: string) {
    const results = await this.publicDb
      .select()
      .from(plans)
      .where(eq(plans.code, code))
      .limit(1);
    return results[0] || null;
  }

  async createSubscription(subscriptionData: NewSubscription) {
    const results = await this.publicDb
      .insert(subscriptions)
      .values(subscriptionData)
      .returning();
    return results[0];
  }

  // ==========================================
  // Tenant-specific Schema Queries (Uses request-scoped database context)
  // ==========================================

  async findUserByEmail(email: string) {
    const db = TenantContext.getDb();
    const results = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        roleName: roles.name,
        permissions: roles.permissions,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.email, email))
      .limit(1);
    return results[0] || null;
  }

  async findUserById(id: string) {
    const db = TenantContext.getDb();
    const results = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        roleName: roles.name,
        permissions: roles.permissions,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, id))
      .limit(1);
    return results[0] || null;
  }
}
