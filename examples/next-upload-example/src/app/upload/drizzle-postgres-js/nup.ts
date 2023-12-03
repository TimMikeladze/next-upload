import { nextUploadConfig } from '@/app/nextUploadConfig';
import { getDbPostgresJs } from '@/drizzle/getDbPostgresJs';
import { NextUpload } from 'next-upload';
import { NextUploadDrizzlePgStore } from 'next-upload/store/drizzle/postgres-js';

export const nup = new NextUpload(
  {
    ...nextUploadConfig,
    api: '/upload/drizzle-postgres-js',
    uploadTypes: {
      ['drizzle-postgres-js']: {},
    },
  },
  new NextUploadDrizzlePgStore(getDbPostgresJs())
);
