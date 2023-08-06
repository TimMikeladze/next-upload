import type Keyv from 'keyv';
import { Asset, AssetStore } from '../../types';
import { NextUpload } from '../../NextUpload';

export class KeyvAssetStore implements AssetStore {
  private keyv: Keyv;

  constructor(keyv: Keyv) {
    this.keyv = keyv;
  }

  async deletePresignedUrl(id: string): Promise<void> {
    await this.keyv.delete([id, 'presignedUrl'].join(':'));
  }

  async getPresignedUrl(id: string): Promise<{
    presignedUrl?: string | null | undefined;
    presignedUrlExpires?: number | null | undefined;
  } | null> {
    return this.keyv.get([id, 'presignedUrl'].join(':'));
  }

  async savePresignedUrl(
    id: string,
    url: string,
    presignedUrlExpirationSeconds?: number | undefined
  ): Promise<void> {
    await this.keyv.set(
      [id, 'presignedUrl'].join(':'),
      {
        presignedUrl: url,
        presignedUrlExpires: presignedUrlExpirationSeconds
          ? NextUpload.calculateExpires(presignedUrlExpirationSeconds * 1000)
          : undefined,
      },
      presignedUrlExpirationSeconds ? presignedUrlExpirationSeconds * 1000 : 0
    );
  }

  async filter(): Promise<Asset[]> {
    const assets: Asset[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for await (const [, asset] of this.keyv.iterator()) {
      assets.push(asset);
    }

    return Promise.resolve(assets);
  }

  async upsert(args: Asset, ttl: number): Promise<Asset> {
    await this.keyv.set(args.id, args, ttl);
    return args;
  }

  async delete(id: string): Promise<void> {
    await this.keyv.delete(id);
  }

  async find(id: string): Promise<Asset | undefined> {
    return this.keyv.get(id);
  }
}
