import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { Asset, AssetStore } from '../../types';
import { NextUpload } from '../../NextUpload';
import { drizzleMysqlAssetsTable } from './DrizzleMysqlSchema';

export class DrizzleMysqlAssetStore implements AssetStore {
  private db: ReturnType<typeof drizzle>;

  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db;
  }

  async all(): Promise<Asset[]> {
    const rows = await this.db.select().from(drizzleMysqlAssetsTable);

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
        .update(drizzleMysqlAssetsTable)
        .set({
          data: args,
          expires,
        })
        .where(eq(drizzleMysqlAssetsTable.id, args.id))
        .returning();

      return {
        ...(rows?.[0]?.data as Asset),
        expires: rows?.[0]?.expires,
        id: rows?.[0]?.id,
        createdAt: rows?.[0]?.createdAt,
        updatedAt: rows?.[0]?.updatedAt,
      };
    }
    const rows = await this.db
      .insert(drizzleMysqlAssetsTable)
      .values({
        id: args?.id || nanoid(),
        data: args,
      })
      .returning();

    if (!rows?.[0]) {
      throw new Error(`Could not insert asset`);
    }

    return {
      ...(rows?.[0]?.data as Asset),
      expires: rows?.[0]?.expires,
      id: rows?.[0]?.id,
      createdAt: rows?.[0]?.createdAt,
      updatedAt: rows?.[0]?.updatedAt,
    };
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(drizzleMysqlAssetsTable)
      .where(eq(drizzleMysqlAssetsTable.id, id));
  }

  async find(id: string): Promise<Asset | undefined> {
    const rows = await this.db
      .select()
      .from(drizzleMysqlAssetsTable)
      .where(eq(drizzleMysqlAssetsTable.id, id));

    if (rows?.[0]) {
      if (NextUpload.isExpired(rows?.[0])) {
        await this.delete(id);
        throw new Error(`Asset expired and was deleted`);
      }
    }

    if (!rows?.[0]) {
      return undefined;
    }

    return {
      ...(rows?.[0]?.data as Asset),
      expires: rows?.[0]?.expires,
      id: rows?.[0]?.id,
      createdAt: rows?.[0]?.createdAt,
      updatedAt: rows?.[0]?.updatedAt,
    };
  }
}
