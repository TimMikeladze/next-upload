import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

let db: ReturnType<typeof drizzle>;

export const getDbPostgresJs = () => {
  if (!db) {
    const client = postgres(
      `${process.env.PG_CONNECTION_STRING}/${process.env.PG_DB}`
    );

    db = drizzle(client);
  }

  return db;
};
