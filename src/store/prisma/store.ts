import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import {
  Asset,
  NextUploadStore,
  AssetWithOptionalId,
  NextUploadAssetsTable,
} from '../../types';
import { NextUpload } from '../../NextUpload';

export class NextUploadPrismaStore implements NextUploadStore {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getPresignedUrl(id: string): Promise<{
    presignedUrl?: string | null;
    presignedUrlExpires?: number | null;
  } | null> {
    const asset = await this.prisma.nextUploadAsset.findFirst({
      select: {
        presignedUrl: true,
        presignedUrlExpires: true,
      },
      where: {
        id,
      },
    });

    if (!asset) {
      return null;
    }

    if (!asset.presignedUrl) {
      return null;
    }

    return asset;
  }

  async deletePresignedUrl(id: string): Promise<void> {
    await this.prisma.nextUploadAsset.update({
      where: { id },
      data: {
        presignedUrl: null,
        presignedUrlExpires: null,
      },
    });
  }

  async savePresignedUrl(
    id: string,
    url: string,
    presignedUrlExpirationSeconds?: number
  ): Promise<void> {
    await this.prisma.nextUploadAsset.update({
      where: { id },
      data: {
        presignedUrl: url,
        presignedUrlExpires: presignedUrlExpirationSeconds
          ? NextUpload.calculateExpires(presignedUrlExpirationSeconds * 1000)
          : undefined,
      },
    });
  }

  async all(): Promise<Asset[]> {
    const assets = await this.prisma.nextUploadAsset.findMany();
    return assets.map((asset: NextUploadAssetsTable) => ({
      ...(asset.data as Asset),
      ...asset,
    }));
  }

  async upsert(args: AssetWithOptionalId, ttl: number): Promise<Asset> {
    const found = await this.find(args.id);
    const expires = NextUpload.calculateExpires(ttl);

    // eslint-disable-next-line no-param-reassign
    delete args.expires;

    if (found) {
      if (NextUpload.isExpired(found.expires)) {
        await this.delete(args.id);
        throw new Error(`Asset expired and was deleted`);
      }

      const updatedAsset = await this.prisma.nextUploadAsset.update({
        where: { id: args.id },
        data: {
          data: args,
          expires,
        },
        select: {
          data: true,
          expires: true,
          id: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return {
        ...(updatedAsset.data as Asset),
        expires: updatedAsset.expires,
        id: updatedAsset.id,
        createdAt: updatedAsset.createdAt,
        updatedAt: updatedAsset.updatedAt,
      };
    }

    const insertedAsset = await this.prisma.nextUploadAsset.create({
      data: {
        id: args?.id || nanoid(),
        data: args,
      },
      select: {
        data: true,
        expires: true,
        id: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!insertedAsset) {
      throw new Error(`Could not insert asset`);
    }

    return {
      ...(insertedAsset.data as Asset),
      expires: insertedAsset.expires,
      id: insertedAsset.id,
      createdAt: insertedAsset.createdAt,
      updatedAt: insertedAsset.updatedAt,
    };
  }

  async delete(id?: string): Promise<void> {
    if (!id) {
      return;
    }

    await this.prisma.nextUploadAsset.delete({
      where: { id },
    });
  }

  async find(id?: string): Promise<Asset | undefined> {
    if (!id) {
      return undefined;
    }

    const asset = await this.prisma.nextUploadAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      return undefined;
    }

    if (NextUpload.isExpired(asset.expires)) {
      await this.delete(id);
      throw new Error(`Asset expired and was deleted`);
    }

    return {
      ...(asset.data as Asset),
      expires: asset.expires,
      id: asset.id,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  }
}
