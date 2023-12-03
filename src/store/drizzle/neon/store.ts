import { drizzle } from 'drizzle-orm/neon-http';
import { NextUploadDrizzlePgCoreStore } from '../pg-core/store';

export class NextUploadDrizzlePgStore extends NextUploadDrizzlePgCoreStore<
  // @ts-ignore
  typeof drizzle
> {}
