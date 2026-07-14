import { Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as publicSchema from './schemas/public.schema';
import * as tenantSchema from './schemas/tenant.schema';
import { ConfigService } from '@nestjs/config';

export const databaseProviders: Provider[] = [
  {
    provide: 'DATABASE_POOL',
    useFactory: (configService: ConfigService) => {
      return new Pool({
        host: configService.getOrThrow<string>('DB_HOST'),
        port: parseInt(configService.getOrThrow<string>('DB_PORT'), 10),
        user: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    },
    inject: [ConfigService],
  },
  {
    provide: 'DATABASE_PUBLIC',
    useFactory: (pool: Pool) => {
      return drizzle(pool, {
        schema: { ...publicSchema, ...tenantSchema },
      });
    },
    inject: ['DATABASE_POOL'],
  },
];
