import { drizzle } from 'drizzle-orm/node-postgres';
import { NextUploadDrizzlePgCoreStore } from '../pg-core/store';

export class NextUploadDrizzlePgStore extends NextUploadDrizzlePgCoreStore<
  typeof drizzle
> {}
