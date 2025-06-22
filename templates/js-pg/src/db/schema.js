import { sql } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  timestamp,
  boolean,
  text,
  check,
} from 'drizzle-orm/pg-core';

export const role = pgEnum('role', ['admin', 'user']);

export const usersTable = pgTable(
  'users',
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    username: text().notNull().unique(),
    email: text().notNull().unique(),
    password: text().notNull(),
    role: role().default('user'),
    verified: boolean().default(false),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    check('password_min_length', sql`char_length(${table.password}) >= 8`),
    check('username_min_length', sql`char_length(${table.username}) >= 3`),
    check(
      'email_format',
      sql`${table.email} ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'`,
    ),
  ],
);
