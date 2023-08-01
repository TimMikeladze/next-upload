import { it, expect, describe, beforeEach, afterEach } from 'vitest';
import Keyv from 'keyv';
import KeyvPostgres from '@keyv/postgres';
import { Asset, AssetStore, NextUpload, NextUploadConfig } from '../src';

const nextUploadConfig: NextUploadConfig = {
  client: {
    secretKey: process.env.MINIO_SECRET_KEY,
    accessKey: process.env.MINIO_ACCESS_KEY,
    endPoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : undefined,
    useSSL: process.env.MINIO_SSL === `true`,
    region: process.env.MINIO_REGION,
  },
  api: `/upload`,
  maxSize: '10mb',
};

describe(`NextUpload`, () => {
  let assetStore: AssetStore;
  let keyv: Keyv;

  beforeEach(() => {
    keyv = new Keyv({
      namespace: NextUpload.namespaceFromEnv(),
      store: new KeyvPostgres({
        uri: `${process.env.PG_CONNECTION_STRING}/${process.env.PG_DB}`,
      }),
    });
    assetStore = new AssetStore(keyv);
  });

  afterEach(async () => {
    await keyv.clear();
  });

  it(`initializes`, async () => {
    const nup = new NextUpload(nextUploadConfig, assetStore);

    await nup.init();

    const client = nup.getClient();

    expect(await client.bucketExists(nup.getBucket())).toBe(true);
  });

  it(`generateSignedUrl`, async () => {
    const nup = new NextUpload(nextUploadConfig, assetStore);

    await nup.init();

    const signedUrl = await nup.generateSignedUrl();

    expect(signedUrl).toMatchObject({
      id: expect.any(String),
      url: expect.any(String),
      data: expect.any(Object),
    });

    expect(assetStore.find(signedUrl.id)).resolves.toMatchObject({
      id: signedUrl.id,
      name: '',
      path: `default/${signedUrl.id}`,
      type: 'default',
      updatedAt: expect.any(String),
      bucket: 'localhost-test',
      verified: null,
    });
  });

  it(`generateSignedUrl & verify assets`, async () => {
    const nup = new NextUpload(
      {
        ...nextUploadConfig,
        verifyAssets: true,
      },
      assetStore
    );

    await nup.init();

    const signedUrl = await nup.generateSignedUrl();

    expect(signedUrl).toMatchObject({
      id: expect.any(String),
      url: expect.any(String),
      data: expect.any(Object),
    });

    expect(assetStore.find(signedUrl.id)).resolves.toMatchObject({
      id: signedUrl.id,
      name: '',
      path: `default/${signedUrl.id}`,
      type: 'default',
      updatedAt: expect.any(String),
      bucket: 'localhost-test',
      verified: false,
    });

    await nup.verifyAsset(signedUrl.id);

    expect(assetStore.find(signedUrl.id)).resolves.toMatchObject({
      id: signedUrl.id,
      verified: true,
    });
  });

  it(`pruneAssets`, async () => {
    const nup = new NextUpload(
      {
        ...nextUploadConfig,
        verifyAssets: true,
      },
      assetStore
    );

    await nup.init();

    await nup.generateSignedUrl();

    const assets: Asset[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const [, value] of assetStore.iterator()) {
      assets.push(value);
    }

    expect(assets.length).toBe(1);

    await nup.pruneAssets();
  });

  it(`bucket from env`, async () => {
    expect(NextUpload.bucketFromEnv()).toEqual(`localhost-test`);
    expect(NextUpload.bucketFromEnv(`next-upload`)).toEqual(
      `localhost-next-upload-test`
    );
  });
});
