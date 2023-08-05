import { mysqlTable, text, json, int, timestamp } from 'drizzle-orm/mysql-core';

const createdAt = timestamp(`createdAt`, {
  mode: 'string',
  fsp: 6,
})
  .notNull()
  .defaultNow();

const updatedAt = timestamp(`updatedAt`, {
  mode: 'string',
  fsp: 6,
})
  .notNull()
  .defaultNow();

export const drizzleMysqlAssetsTable = mysqlTable(`next_upload_assets`, {
  createdAt,
  updatedAt,
  id: text(`id`).primaryKey(),
  data: json(`data`).notNull(),
  expires: int(`expires`),
});
