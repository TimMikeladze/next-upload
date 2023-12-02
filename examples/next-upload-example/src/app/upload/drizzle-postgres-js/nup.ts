import { nextUploadConfig } from '@/app/nextUploadConfig';
import { getDbPostgresJs } from '@/db/getDbPostgresJs';
import { NextUpload } from 'next-upload';
import { DrizzlePostgresStore } from 'next-upload/store/drizzle/postgres-js';

export const nup = new NextUpload(
  {
    ...nextUploadConfig,
    api: '/upload/drizzle-postgres-js',
    uploadTypes: {
      ['drizzle-postgres-js']: {},
    },
  },
  new DrizzlePostgresStore(getDbPostgresJs())
);
