import {
  pgTable,
  jsonb,
  timestamp,
  varchar,
  bigint,
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

export const nextUploadAssetsTable = pgTable(`next_upload_assets`, {
  createdAt,
  updatedAt,
  id: varchar(`id`).primaryKey(),
  data: jsonb(`data`).notNull(),
  expires: bigint(`expires`, {
    mode: 'number',
  }),
  presignedUrl: varchar(`presignedUrl`),
  presignedUrlExpires: bigint(`presignedUrlExpires`, {
    mode: 'number',
  }),
});
