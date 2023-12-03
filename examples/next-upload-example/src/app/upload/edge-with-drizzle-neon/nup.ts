import { nextUploadConfig } from '@/app/nextUploadConfig';
import { getDbServerless } from '@/drizzle/getDbServerless';
import { NextUpload } from 'next-upload';
import { NextUploadDrizzlePgStore } from 'next-upload/store/drizzle/neon';

export const nup = new NextUpload(
  {
    ...nextUploadConfig,
    api: '/edge-with-drizzle-neon',
    uploadTypes: {
      ['edge-with-drizzle-neon']: {},
    },
  },

  new NextUploadDrizzlePgStore(getDbServerless())
);
