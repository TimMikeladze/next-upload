import { nextUploadConfig } from '@/app/nextUploadConfig';
import { getDbServerless } from '@/db/getDbServerless';
import { NextUpload } from 'next-upload';
import { DrizzlePgStore } from 'next-upload/store/drizzle/neon';

export const nup = new NextUpload(
  {
    ...nextUploadConfig,
    api: '/edge-with-drizzle-neon',
    uploadTypes: {
      ['edge-with-drizzle-neon']: {},
    },
  },

  new DrizzlePgStore(getDbServerless())
);
