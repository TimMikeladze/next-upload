import { nextUploadConfig } from '@/app/nextUploadConfig';
import KeyvPostgres from '@keyv/postgres';
import Keyv from 'keyv';
import { NextUpload } from 'next-upload';
import { NextUploadKeyvStore } from 'next-upload/store/keyv';

export const nup = new NextUpload(
  {
    ...nextUploadConfig,
    api: '/upload/keyv',
    uploadTypes: {
      ['keyv']: {},
    },
  },
  new NextUploadKeyvStore(
    new Keyv({
      namespace: NextUpload.namespaceFromEnv(),
      store: new KeyvPostgres({
        uri: `${process.env.PG_CONNECTION_STRING}/${process.env.PG_DB}`,
      }),
    })
  )
);
