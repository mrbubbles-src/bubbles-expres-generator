import { sql } from 'drizzle-orm';
import { boolean } from 'drizzle-orm/pg-core';
import { pgEnum, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const role = pgEnum('role', ['admin', 'user']);

export const usersTable = pgTable('users', {
  id: varchar({ length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: varchar({ length: 20 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  role: role().default('user'),
  verified: boolean().default(false),
  createdAt: timestamp({ precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
