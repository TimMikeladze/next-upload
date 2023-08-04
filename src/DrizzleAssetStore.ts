import {
  pgTable,
  jsonb,
  integer,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { Asset, NextUploadAssetStore } from './types';
import { NextUpload } from './NextUpload';

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

const assetsTable = pgTable(`next_upload_assets`, {
  createdAt,
  updatedAt,
  id: varchar(`id`).primaryKey(),
  data: jsonb(`data`).notNull(),
  expires: integer(`expires`),
});

export class DrizzlePostgresAssetStore implements NextUploadAssetStore {
  public static tables = {
    assetsTable,
  };

  private db: ReturnType<typeof drizzle>;

  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db;
  }

  async all(): Promise<Asset[]> {
    const rows = await this.db
      .select()
      .from(DrizzlePostgresAssetStore.tables.assetsTable);

    return rows.map((row) => ({
      ...(row.data as Asset),
      ...row,
    }));
  }

  async upsert(args: Asset, ttl: number): Promise<Asset> {
    const found = await this.find(args.id);

    const expires = NextUpload.calculateExpires(ttl);

    // eslint-disable-next-line no-param-reassign
    delete args.expires;

    if (found) {
      if (NextUpload.isExpired(found)) {
        await this.delete(args.id);
        throw new Error(`Asset expired and was deleted`);
      }
      const rows = await this.db
        .update(DrizzlePostgresAssetStore.tables.assetsTable)
        .set({
          data: args,
          expires,
        })
        .where(eq(DrizzlePostgresAssetStore.tables.assetsTable.id, args.id))
        .returning();

      return {
        ...(rows?.[0].data as Asset),
        expires: rows?.[0].expires,
        id: rows?.[0].id,
        createdAt: rows?.[0].createdAt,
        updatedAt: rows?.[0].updatedAt,
      };
    }

    const rows = await this.db
      .insert(DrizzlePostgresAssetStore.tables.assetsTable)
      .values({
        id: args?.id || nanoid(),
        data: args,
      })
      .returning();

    return {
      ...(rows?.[0].data as Asset),
      expires: rows?.[0].expires,
      id: rows?.[0].id,
      createdAt: rows?.[0].createdAt,
      updatedAt: rows?.[0].updatedAt,
    };
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(DrizzlePostgresAssetStore.tables.assetsTable)
      .where(eq(DrizzlePostgresAssetStore.tables.assetsTable.id, id));
  }

  async find(id: string): Promise<Asset | undefined> {
    const rows = await this.db
      .select()
      .from(DrizzlePostgresAssetStore.tables.assetsTable)
      .where(eq(DrizzlePostgresAssetStore.tables.assetsTable.id, id));

    if (rows?.[0]) {
      if (NextUpload.isExpired(rows?.[0])) {
        await this.delete(id);
        throw new Error(`Asset expired and was deleted`);
      }
    }

    return {
      ...(rows?.[0].data as Asset),
      expires: rows?.[0].expires,
      id: rows?.[0].id,
      createdAt: rows?.[0].createdAt,
      updatedAt: rows?.[0].updatedAt,
    };
  }
}
