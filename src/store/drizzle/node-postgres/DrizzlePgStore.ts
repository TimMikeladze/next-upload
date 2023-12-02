import { drizzle } from 'drizzle-orm/node-postgres';
import { DrizzlePgCoreStore } from '../pg-core/DrizzlePgCoreStore';

export class DrizzlePgStore extends DrizzlePgCoreStore<typeof drizzle> {}
