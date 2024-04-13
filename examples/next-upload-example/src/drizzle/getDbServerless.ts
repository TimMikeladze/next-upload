import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.PG_CONNECTION_STRING + `/` + process.env.PG_DB);

const db = drizzle(sql);

export const getDbServerless = () => db;
