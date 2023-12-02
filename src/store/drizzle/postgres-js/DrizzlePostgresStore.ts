import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { Asset, NextUploadStore } from '../../../types';
import { NextUpload } from '../../../NextUpload';
import { drizzlePostgresNextUploadAssetsTable } from './DrizzlePostgresSchema';

export class DrizzlePostgresStore implements NextUploadStore {
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
        presignedUrl: drizzlePostgresNextUploadAssetsTable.presignedUrl,
        presignedUrlExpires:
          drizzlePostgresNextUploadAssetsTable.presignedUrlExpires,
      })
      .from(drizzlePostgresNextUploadAssetsTable)
      .where(eq(drizzlePostgresNextUploadAssetsTable.id, id));

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
      .update(drizzlePostgresNextUploadAssetsTable)
      .set({
        presignedUrl: null,
        presignedUrlExpires: null,
      })
      .where(eq(drizzlePostgresNextUploadAssetsTable.id, id));
  }

  async savePresignedUrl(
    id: string,
    url: string,
    presignedUrlExpirationSeconds?: number
  ): Promise<void> {
    await this.db
      .update(drizzlePostgresNextUploadAssetsTable)
      .set({
        presignedUrl: url,
        presignedUrlExpires: presignedUrlExpirationSeconds
          ? NextUpload.calculateExpires(presignedUrlExpirationSeconds * 1000)
          : undefined,
      })
      .where(eq(drizzlePostgresNextUploadAssetsTable.id, id));
  }

  async all(): Promise<Asset[]> {
    const rows = await this.db
      .select()
      .from(drizzlePostgresNextUploadAssetsTable);

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
        .update(drizzlePostgresNextUploadAssetsTable)
        .set({
          data: args,
          expires,
        })
        .where(eq(drizzlePostgresNextUploadAssetsTable.id, args.id))
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
      .insert(drizzlePostgresNextUploadAssetsTable)
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
      .delete(drizzlePostgresNextUploadAssetsTable)
      .where(eq(drizzlePostgresNextUploadAssetsTable.id, id));
  }

  async find(id: string): Promise<Asset | undefined> {
    const rows = await this.db
      .select()
      .from(drizzlePostgresNextUploadAssetsTable)
      .where(eq(drizzlePostgresNextUploadAssetsTable.id, id));

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
