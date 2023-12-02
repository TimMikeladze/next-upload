import { drizzle } from 'drizzle-orm/neon-http';
import { DrizzlePgCoreStore } from '../pg-core/DrizzlePgCoreStore';

export class DrizzlePgStore extends DrizzlePgCoreStore<
  // @ts-ignore
  typeof drizzle
> {}
