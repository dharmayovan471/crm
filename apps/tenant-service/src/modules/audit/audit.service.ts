import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { auditLogs } from '../database/schemas/public.schema';

@Injectable()
export class AuditService {
  constructor(
    @Inject('DATABASE_PUBLIC') private readonly publicDb: NodePgDatabase<any>,
  ) {}

  async logAction(
    userId: string | null,
    tenantId: string | null,
    action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE',
    entity?: string,
    entityId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.publicDb.insert(auditLogs).values({
        userId,
        tenantId,
        action,
        entity,
        entityId,
        ipAddress,
        userAgent,
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }
}
