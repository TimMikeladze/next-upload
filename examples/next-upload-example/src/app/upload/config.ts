import { type NextUploadConfig } from 'next-upload';

export enum NextUploadType {
  image = `image`,
}

export const config: NextUploadConfig = {
  maxSize: process.env.NEXT_PUBLIC_MAX_SIZE || '1mb',
  client: {
    secretKey: process.env.MINIO_SECRET_KEY,
    accessKey: process.env.MINIO_ACCESS_KEY,
    endPoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : undefined,
    useSSL: process.env.MINIO_SSL === `true`,
    region: process.env.MINIO_REGION,
  },
  uploadTypes: {
    [NextUploadType.image]: {},
  },
};

export { NextUploadConfig };
