import { nextUploadConfig } from '@/app/nextUploadConfig';
import { getDbNodePostgres } from '@/db/getDbNodePostgres';
import { NextUpload } from 'next-upload';
import { DrizzlePostgresStore } from 'next-upload/store/drizzle/postgres-js';

export const nup = new NextUpload(
  {
    ...nextUploadConfig,
    api: '/upload/drizzle-node-postgres',
    uploadTypes: {
      ['drizzle-node-postgres']: {},
    },
  },
  async () =>
    new DrizzlePostgresStore(
      // @ts-ignore
      await getDbNodePostgres()
    )
);
