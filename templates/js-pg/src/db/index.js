import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';
import * as schema from './schema.js';
// import * as relations from './relations.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is not set or is undefined',
  );
}

const client = postgres(databaseUrl, { prepare: false, max: 5 });

export const db = drizzle(client, {
  schema: {
    ...schema,
    // ...relations,
  },
});
