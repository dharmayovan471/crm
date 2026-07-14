import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;

if (!host || !port || !user || !password || !database) {
  throw new Error('Required Database environment variables are missing');
}

export default defineConfig({
  schema: './src/modules/database/schemas/public.schema.ts',
  out: './src/modules/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host,
    port: parseInt(port, 10),
    user,
    password,
    database,
    ssl: false,
  },
  verbose: true,
  strict: true,
});
