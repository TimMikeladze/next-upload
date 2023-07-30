import type { NextUploadConfig } from 'next-upload';

// eslint-disable-next-line no-shadow
export enum NextUploadType {
  image = `image`,
}

export const nextUploadConfig: NextUploadConfig = {
  client: {
    secretKey: process.env.MINIO_SECRET_KEY,
    accessKey: process.env.MINIO_ACCESS_KEY,
    endPoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : undefined,
    useSSL: process.env.MINIO_SSL === `true`,
    region: process.env.MINIO_REGION,
  },
  path: `/upload`,
  uploadTypes: {
    [NextUploadType.image]: {
      maxSize: '2mb',
    },
  },
};
