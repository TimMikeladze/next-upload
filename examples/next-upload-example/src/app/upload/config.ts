import { type NextUploadConfig } from 'next-upload/client';

export enum NextUploadType {
  image = `image`,
}

export const config: NextUploadConfig = {
  maxSize: process.env.NEXT_PUBLIC_MAX_SIZE || '1mb',
  // verifyAssets: true,
  client: {
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      secretAccessKey: process.env.S3_SECRET_KEY,
      accessKeyId: process.env.S3_ACCESS_KEY,
    },
    forcePathStyle: true,
  },
  uploadTypes: {
    [NextUploadType.image]: {},
  },
};
