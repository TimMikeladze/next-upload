import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

let db: ReturnType<typeof drizzle>;

export const getDb = async () => {
  if (!db) {
    const client = new Pool({
      connectionString: `${process.env.PG_CONNECTION_STRING}/${process.env.PG_DB}`,
    });

    await client.connect();
    db = drizzle(client);
  }

  return db;
};
