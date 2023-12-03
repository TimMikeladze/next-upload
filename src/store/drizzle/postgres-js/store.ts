import { drizzle } from 'drizzle-orm/postgres-js';
import { NextUploadDrizzlePgCoreStore } from '../pg-core/store';

export class NextUploadDrizzlePgStore extends NextUploadDrizzlePgCoreStore<
  typeof drizzle
> {}
