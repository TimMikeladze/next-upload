import {
  pgTable,
  jsonb,
  integer,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

const createdAt = timestamp(`createdAt`, {
  withTimezone: true,
})
  .notNull()
  .defaultNow();

const updatedAt = timestamp(`updatedAt`, {
  withTimezone: true,
})
  .notNull()
  .defaultNow();

export const drizzlePgAssetsTable = pgTable(`next_upload_assets`, {
  createdAt,
  updatedAt,
  id: varchar(`id`).primaryKey(),
  data: jsonb(`data`).notNull(),
  expires: integer(`expires`),
});
