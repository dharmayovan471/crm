import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, 'apps/tenant-service/.env') });

const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;

if (!host || !port || !user || !password || !database) {
  throw new Error('Required Database environment variables are missing');
}

export default defineConfig({
  schema: './apps/backend/src/infrastructure/persistence/tenant.schema.ts',
  out: './apps/backend/src/infrastructure/persistence/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host,
    port: parseInt(port, 10),
    user,
    password,
    database,
  },
});
