import { AssetStore, NextUpload } from 'next-upload';
import { config } from './config';
import { NextRequest } from 'next/server';
import Keyv from 'keyv';
import KeyvPostgres from '@keyv/postgres';

export const nup = new NextUpload(
  config,
  new AssetStore(
    new Keyv({
      namespace: NextUpload.namespaceFromEnv(),
      store: new KeyvPostgres({
        uri: process.env.PG_CONNECTION_STRING + '/' + process.env.PG_DB,
      }),
    })
  )
);

export const POST = (request: NextRequest) => nup.handler(request);
