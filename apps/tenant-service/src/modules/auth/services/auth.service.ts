import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, inArray } from 'drizzle-orm';
import { users, roles, designations, departments, employees, permissions, rolePermissions, userRoles } from '../../database/schemas/tenant.schema';
import { tenants } from '../../database/schemas/public.schema';
import { TenantContext } from '../../common/context/tenant.context';
import { RedisService } from '../../redis/redis.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class AuthService {
  private readonly bcryptCostFactor = 12;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly auditService: AuditService,
    @Inject('DATABASE_PUBLIC') private readonly publicDb: NodePgDatabase<any>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptCostFactor);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateTokens(payload: {
    sub: string;
    tenantId: string;
    tenantCode: string;
    schemaName: string;
    roles: string[];
    permissions: string[];
  }) {
    const accessSecret = this.configService.get<string>('JWT_SECRET', 'super_secret_nest_microservice_jwt_access_key_2026');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET', 'super_secret_nest_microservice_jwt_refresh_key_2026');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    // Store in Redis (session active)
    const sessionKey = `tenant-service:session:${payload.sub}`;
    await this.redisService.set(sessionKey, refreshToken, 7 * 24 * 60 * 60); // 7 days TTL

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(userPayload: any, ipAddress?: string, userAgent?: string) {
    const sessionKey = `tenant-service:session:${userPayload.userId}`;
    await this.redisService.del(sessionKey);

    await this.auditService.logAction(
      userPayload.userId,
      userPayload.tenantId,
      'LOGOUT',
      'users',
      userPayload.userId,
      ipAddress,
      userAgent,
    );

    return { message: 'Logged out successfully' };
  }

  async getMe(userPayload: any) {
    const db = TenantContext.getDb();

    // 1. Fetch user profile
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        profilePhotoUrl: users.profilePhotoUrl,
        phone: users.phone,
        isActive: users.isActive,
        lastLogin: users.lastLogin,
        designationId: users.designationId,
        departmentId: users.departmentId,
        employeeId: users.employeeId,
        designationName: designations.name,
        departmentName: departments.name,
        employeeCode: employees.employeeCode,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(designations, eq(users.designationId, designations.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(employees, eq(users.employeeId, employees.id))
      .where(eq(users.id, userPayload.userId))
      .limit(1);

    const userProfile = userResult[0];
    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    // 2. Fetch roles
    const rolesResult = await db
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userPayload.userId));

    let userRolesList = rolesResult.map((r: any) => r.name);
    if (userRolesList.length === 0 && userProfile.designationId) {
      // Try to find if they have a legacy role
      const legacyUser = await db
        .select({ roleId: users.roleId })
        .from(users)
        .where(eq(users.id, userPayload.userId))
        .limit(1);
      if (legacyUser[0]?.roleId) {
        const legacyRole = await db
          .select({ name: roles.name })
          .from(roles)
          .where(eq(roles.id, legacyUser[0].roleId))
          .limit(1);
        if (legacyRole[0]) {
          userRolesList = [legacyRole[0].name];
        }
      }
    }

    // 3. Fetch permissions
    let userPermissionsList: string[] = [];
    if (rolesResult.length > 0) {
      const permsResult = await db
        .select({
          code: permissions.code,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(inArray(rolePermissions.roleId, rolesResult.map((r: any) => r.id)));
      userPermissionsList = permsResult.map((p: any) => p.code);
    } else {
      const legacyUser = await db
        .select({ roleId: users.roleId })
        .from(users)
        .where(eq(users.id, userPayload.userId))
        .limit(1);
      if (legacyUser[0]?.roleId) {
        const legacyRole = await db
          .select({ permissions: roles.permissions })
          .from(roles)
          .where(eq(roles.id, legacyUser[0].roleId))
          .limit(1);
        if (legacyRole[0]?.permissions) {
          userPermissionsList = legacyRole[0].permissions;
        }
      }
    }

    // 4. Fetch tenant details
    const tenantResult = await this.publicDb
      .select()
      .from(tenants)
      .where(eq(tenants.id, userPayload.tenantId))
      .limit(1);
    const tenantDetails = tenantResult[0] || null;

    return {
      user: userProfile,
      roles: userRolesList,
      permissions: userPermissionsList,
      tenant: tenantDetails,
    };
  }
}
