import { it, expect } from 'vitest';
import { NextUpload, NextUploadConfig } from '../src';
import { InMemoryS3Client } from '../src/InMemoryS3Client';

// eslint-disable-next-line no-shadow
enum NextUploadType {
  image = `image`,
}

const inMemoryS3Client = new InMemoryS3Client();

const nextUploadConfig: NextUploadConfig = {
  client: {
    secretKey: process.env.MINIO_SECRET_KEY,
    accessKey: process.env.MINIO_ACCESS_KEY,
    endPoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : undefined,
    useSSL: process.env.MINIO_SSL === `true`,
    region: process.env.MINIO_REGION,
  },
  s3Client: () => inMemoryS3Client,
  api: `/upload`,
  uploadTypes: {
    [NextUploadType.image]: {
      maxSize: '2mb',
    },
  },
};

it(`initializes`, async () => {
  const nextUpload = new NextUpload(nextUploadConfig);

  await nextUpload.init();

  expect(inMemoryS3Client.regions.has(process.env.MINIO_REGION)).toEqual(true);
});

it(`bucket from env`, async () => {
  expect(NextUpload.bucketFromEnv()).toEqual(`localhost-test`);
  expect(NextUpload.bucketFromEnv(`next-upload`)).toEqual(
    `localhost-next-upload-test`
  );
});
