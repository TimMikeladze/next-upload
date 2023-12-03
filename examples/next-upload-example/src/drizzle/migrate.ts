import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { migrate as serverlessMigrate } from 'drizzle-orm/neon-http/migrator';
import dotenv from 'dotenv';
import { resolve } from 'path';

import { getDbPostgresJs } from '@/drizzle/getDbPostgresJs';

(async () => {
  dotenv.config();

  if (process.env.VERCEL) {
    const getDbServerless = (await import(`@/drizzle/getDbServerless`))
      .getDbServerless;
    await serverlessMigrate(await getDbServerless(), {
      migrationsFolder: resolve(`src/drizzle/migrations`),
    })
      .then(() => {
        console.log(`Migrations complete!`);
        process.exit(0);
      })
      .catch((err) => {
        console.error(`Migrations failed!`, err);
        process.exit(1);
      });
  } else {
    await migrate(await getDbPostgresJs(), {
      migrationsFolder: resolve(`src/drizzle/migrations`),
    })
      .then(() => {
        console.log(`Migrations complete!`);
        process.exit(0);
      })
      .catch((err) => {
        console.error(`Migrations failed!`, err);
        process.exit(1);
      });
  }

  process.exit(0);
})();
