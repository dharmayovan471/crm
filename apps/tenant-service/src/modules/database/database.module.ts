import { Global, Module } from '@nestjs/common';
import { databaseProviders } from './database.provider';
import { TenantDatabaseInterceptor } from './interceptors/tenant-database.interceptor';
import { MigrationService } from './migration.service';

@Global()
@Module({
  providers: [...databaseProviders, TenantDatabaseInterceptor, MigrationService],
  exports: [...databaseProviders, TenantDatabaseInterceptor, MigrationService],
})
export class DatabaseModule {}
