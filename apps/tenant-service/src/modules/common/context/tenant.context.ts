import { AsyncLocalStorage } from 'async_hooks';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface TenantContextStore {
  schemaName: string;
  tenantCode: string;
  db: NodePgDatabase<any>;
}

export class TenantContext {
  private static storage = new AsyncLocalStorage<TenantContextStore>();

  static run<T>(context: TenantContextStore, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  static get(): TenantContextStore | undefined {
    return this.storage.getStore();
  }

  static getDb(): NodePgDatabase<any> {
    const store = this.get();
    if (!store?.db) {
      throw new Error('Database connection is not initialized for this context');
    }
    return store.db;
  }

  static getSchemaName(): string {
    return this.get()?.schemaName || 'public';
  }

  static getTenantCode(): string {
    return this.get()?.tenantCode || 'public';
  }
}
