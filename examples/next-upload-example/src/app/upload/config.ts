import { NextUpload } from 'next-upload';

// eslint-disable-next-line no-shadow
export enum UploadType {
  image = `image`,
}

export const nextUpload = new NextUpload({
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
    [UploadType.image]: {},
  },
});
