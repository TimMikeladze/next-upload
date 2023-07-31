import { type NextUploadConfig } from 'next-upload';

// export enum NextUploadType {
//   image = `image`,
// }

export const nextUploadConfig: NextUploadConfig = {
  // this is the path to the api route that will handle the upload
  api: `/upload`,
  // default max size for uploads
  maxSize: '2mb',
  // be sure to start minio with the following command: docker-compose up -d
  client: {
    secretKey: process.env.MINIO_SECRET_KEY,
    accessKey: process.env.MINIO_ACCESS_KEY,
    endPoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : undefined,
    useSSL: process.env.MINIO_SSL === `true`,
    region: process.env.MINIO_REGION,
  },
  // uploadTypes: {
  //   [NextUploadType.image]: {
  //     maxSize: '2mb',
  //   },
  // },
};
