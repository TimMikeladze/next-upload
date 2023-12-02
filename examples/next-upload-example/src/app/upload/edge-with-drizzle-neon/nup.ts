import { nextUploadConfig } from '@/app/nextUploadConfig';
import { getDbServerless } from '@/db/getDbServerless';
import { NextUpload } from 'next-upload';
import { DrizzlePostgresStore } from 'next-upload/store/drizzle/postgres-js';

export const nup = new NextUpload(
  {
    ...nextUploadConfig,
    api: '/edge-with-drizzle-neon',
    uploadTypes: {
      ['edge-with-drizzle-neon']: {},
    },
  },

  new DrizzlePostgresStore(
    // @ts-ignore
    getDbServerless()
  )
);
