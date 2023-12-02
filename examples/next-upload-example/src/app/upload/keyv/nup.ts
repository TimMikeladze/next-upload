import { nextUploadConfig } from '@/app/nextUploadConfig';
import KeyvPostgres from '@keyv/postgres';
import Keyv from 'keyv';
import { NextUpload } from 'next-upload';
import { KeyvStore } from 'next-upload/store/keyv';

export const nup = new NextUpload(
  {
    ...nextUploadConfig,
    api: '/upload/keyv',
    uploadTypes: {
      ['keyv']: {},
    },
  },
  new KeyvStore(
    new Keyv({
      namespace: NextUpload.namespaceFromEnv(),
      store: new KeyvPostgres({
        uri: `${process.env.PG_CONNECTION_STRING}/${process.env.PG_DB}`,
      }),
    })
  )
);
