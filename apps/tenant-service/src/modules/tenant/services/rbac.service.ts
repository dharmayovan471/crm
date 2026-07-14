import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, inArray } from 'drizzle-orm';
import { TenantContext } from '../../common/context/tenant.context';
import { permissions, rolePermissions, userRoles, roles, users } from '../../database/schemas/tenant.schema';
import { PermissionCreateDto } from '../dto/rbac.dto';

@Injectable()
export class RbacService {
  constructor(
    @Inject('DATABASE_PUBLIC') private readonly publicDb: NodePgDatabase<any>,
  ) {}

  // ==========================================
  // Permissions CRUD
  // ==========================================

  async createPermission(dto: PermissionCreateDto) {
    const db = TenantContext.getDb();
    const result = await db
      .insert(permissions)
      .values({
        code: dto.code,
        name: dto.name,
        module: dto.module,
        description: dto.description,
      })
      .returning();
    return result[0];
  }

  async getAllPermissions() {
    const db = TenantContext.getDb();
    return db.select().from(permissions);
  }

  async getPermissionById(id: string) {
    const db = TenantContext.getDb();
    const result = await db
      .select()
      .from(permissions)
      .where(eq(permissions.id, id))
      .limit(1);
    
    const permission = result[0];
    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }
    return permission;
  }

  async updatePermission(id: string, dto: PermissionCreateDto) {
    const db = TenantContext.getDb();
    const result = await db
      .update(permissions)
      .set({
        code: dto.code,
        name: dto.name,
        module: dto.module,
        description: dto.description,
      })
      .where(eq(permissions.id, id))
      .returning();

    const permission = result[0];
    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }
    return permission;
  }

  async deletePermission(id: string) {
    const db = TenantContext.getDb();
    const result = await db
      .delete(permissions)
      .where(eq(permissions.id, id))
      .returning();

    const permission = result[0];
    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }
    return { message: 'Permission deleted successfully' };
  }

  // ==========================================
  // Role Permissions
  // ==========================================

  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    const db = TenantContext.getDb();

    // Verify role exists
    const roleResult = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);
    if (!roleResult[0]) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Delete existing mappings
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    // Insert new mappings if array is not empty
    if (permissionIds.length > 0) {
      const valuesToInsert = permissionIds.map((permId) => ({
        roleId,
        permissionId: permId,
      }));
      await db.insert(rolePermissions).values(valuesToInsert);
    }

    return { message: 'Permissions assigned to role successfully' };
  }

  async getRolePermissions(roleId: string) {
    const db = TenantContext.getDb();

    // Verify role exists
    const roleResult = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);
    if (!roleResult[0]) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Query active permissions for the role
    const results = await db
      .select({
        id: permissions.id,
        code: permissions.code,
        name: permissions.name,
        module: permissions.module,
        description: permissions.description,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    return results;
  }

  // ==========================================
  // User Roles
  // ==========================================

  async assignRolesToUser(userId: string, roleIds: string[]) {
    const db = TenantContext.getDb();

    // Verify user exists
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!userResult[0]) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    // Delete existing mappings
    await db.delete(userRoles).where(eq(userRoles.userId, userId));

    // Insert new mappings if array is not empty
    if (roleIds.length > 0) {
      const valuesToInsert = roleIds.map((rId) => ({
        userId,
        roleId: rId,
      }));
      await db.insert(userRoles).values(valuesToInsert);
    }

    return { message: 'Roles assigned to user successfully' };
  }

  async getUserRoles(userId: string) {
    const db = TenantContext.getDb();

    // Verify user exists
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!userResult[0]) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    const results = await db
      .select({
        id: roles.id,
        name: roles.name,
        createdAt: roles.createdAt,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    return results;
  }
}
