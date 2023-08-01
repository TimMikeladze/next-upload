import type Keyv from 'keyv';
import { Asset, NextUploadAssetStore } from './types';

export class AssetStore implements NextUploadAssetStore {
  private keyv: Keyv;

  constructor(keyv: Keyv) {
    this.keyv = keyv;
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

  iterator() {
    return this.keyv.iterator();
  }
}
