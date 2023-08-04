import { DrizzlePgAssetStore, KeyvAssetStore, NextUpload } from 'next-upload';
import { config } from './config';
import Keyv from 'keyv';
import KeyvPostgres from '@keyv/postgres';

export const nup = new NextUpload(
  config,
  new KeyvAssetStore(
    new Keyv({
      namespace: NextUpload.namespaceFromEnv(),
      store: new KeyvPostgres({
        uri: process.env.PG_CONNECTION_STRING + '/' + process.env.PG_DB,
      }),
    })
  )
);
