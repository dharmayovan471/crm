import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { TenantContext } from '../../common/context/tenant.context';
import * as publicSchema from '../schemas/public.schema';
import * as tenantSchema from '../schemas/tenant.schema';

@Injectable()
export class TenantDatabaseInterceptor implements NestInterceptor {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const tenantCode = req['tenantCode'] || 'public';
    let schemaName = req['schemaName'] || 'public';

    // Double check that schema name matches convention if not set
    if (tenantCode !== 'public' && schemaName === 'public') {
      schemaName = `tenant_${tenantCode.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
    }

    // Checkout connection client from the database pool
    const client = await this.pool.connect();

    try {
      // Set the schema search path in PostgreSQL for this request transaction/connection context
      // Note: We search in tenant schema first, then fallback to public schema
      await client.query(`SET search_path TO "${schemaName}", "public"`);

      // Initialize Drizzle ORM client with schema definitions
      const db = drizzle(client, {
        schema: { ...publicSchema, ...tenantSchema },
      });

      // Bind to Request object
      req['db'] = db;

      // Run execution context inside AsyncLocalStorage and get RxJS observable
      let nextObservable!: Observable<any>;
      TenantContext.run({ schemaName, tenantCode, db }, () => {
        nextObservable = next.handle();
      });

      return nextObservable.pipe(
        finalize(() => {
          // Release client connection back to the pool
          client.release();
        }),
      );
    } catch (err) {
      client.release();
      throw err;
    }
  }
}
