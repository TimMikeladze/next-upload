import type Keyv from 'keyv';
import { Asset, NextUploadAssetStore } from './types';

export class KeyvAssetStore implements NextUploadAssetStore {
  private keyv: Keyv;

  constructor(keyv: Keyv) {
    this.keyv = keyv;
  }

  async all(): Promise<Asset[]> {
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
