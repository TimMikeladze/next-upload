import { nextUploadConfig } from '@/app/nextUploadConfig';
import { getDbNodePostgres } from '@/db/getDbNodePostgres';
import { NextUpload } from 'next-upload';
import { DrizzlePgStore } from 'next-upload/store/drizzle/node-postgres';

export const nup = new NextUpload(
  {
    ...nextUploadConfig,
    api: '/upload/drizzle-node-postgres',
    uploadTypes: {
      ['drizzle-node-postgres']: {},
    },
  },
  async () => new DrizzlePgStore(await getDbNodePostgres())
);
