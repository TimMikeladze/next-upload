import { drizzle } from 'drizzle-orm/postgres-js';
import { DrizzlePgCoreStore } from '../pg-core/DrizzlePgCoreStore';

export class DrizzlePgStore extends DrizzlePgCoreStore<typeof drizzle> {}
