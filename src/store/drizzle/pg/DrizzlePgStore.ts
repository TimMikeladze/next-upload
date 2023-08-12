import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { Asset, NextUploadStore } from '../../../types';
import { NextUpload } from '../../../NextUpload';
import { drizzlePgAssetsTable } from './DrizzlePgSchema';

export class DrizzlePgStore implements NextUploadStore {
  private db: ReturnType<typeof drizzle>;

  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db;
  }

  async getPresignedUrl(id: string): Promise<{
    presignedUrl?: string | null;
    presignedUrlExpires?: number | null;
  } | null> {
    const rows = await this.db
      .select({
        presignedUrl: drizzlePgAssetsTable.presignedUrl,
        presignedUrlExpires: drizzlePgAssetsTable.presignedUrlExpires,
      })
      .from(drizzlePgAssetsTable)
      .where(eq(drizzlePgAssetsTable.id, id));

    if (!rows?.[0]) {
      return null;
    }

    if (!rows?.[0]?.presignedUrl) {
      return null;
    }

    return rows?.[0];
  }

  async deletePresignedUrl(id: string): Promise<void> {
    await this.db
      .update(drizzlePgAssetsTable)
      .set({
        presignedUrl: null,
        presignedUrlExpires: null,
      })
      .where(eq(drizzlePgAssetsTable.id, id));
  }

  savePresignedUrl(
    id: string,
    url: string,
    presignedUrlExpirationSeconds?: number
  ): Promise<void> {
    return this.db
      .update(drizzlePgAssetsTable)
      .set({
        presignedUrl: url,
        presignedUrlExpires: presignedUrlExpirationSeconds
          ? NextUpload.calculateExpires(presignedUrlExpirationSeconds * 1000)
          : undefined,
      })
      .where(eq(drizzlePgAssetsTable.id, id));
  }

  async all(): Promise<Asset[]> {
    const rows = await this.db.select().from(drizzlePgAssetsTable);

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
      if (NextUpload.isExpired(found.expires)) {
        await this.delete(args.id);
        throw new Error(`Asset expired and was deleted`);
      }
      const rows = await this.db
        .update(drizzlePgAssetsTable)
        .set({
          data: args,
          expires,
        })
        .where(eq(drizzlePgAssetsTable.id, args.id))
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
      .insert(drizzlePgAssetsTable)
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
      .delete(drizzlePgAssetsTable)
      .where(eq(drizzlePgAssetsTable.id, id));
  }

  async find(id: string): Promise<Asset | undefined> {
    const rows = await this.db
      .select()
      .from(drizzlePgAssetsTable)
      .where(eq(drizzlePgAssetsTable.id, id));

    if (rows?.[0]) {
      if (NextUpload.isExpired(rows?.[0]?.expires)) {
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