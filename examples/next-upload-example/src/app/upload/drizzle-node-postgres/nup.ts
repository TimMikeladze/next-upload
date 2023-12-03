import { nextUploadConfig } from '@/app/nextUploadConfig';
import { getDbNodePostgres } from '@/drizzle/getDbNodePostgres';
import { NextUpload } from 'next-upload';
import { NextUploadDrizzlePgStore } from 'next-upload/store/drizzle/node-postgres';

export const nup = new NextUpload(
  {
    ...nextUploadConfig,
    api: '/upload/drizzle-node-postgres',
    uploadTypes: {
      ['drizzle-node-postgres']: {},
    },
  },
  async () => new NextUploadDrizzlePgStore(await getDbNodePostgres())
);
