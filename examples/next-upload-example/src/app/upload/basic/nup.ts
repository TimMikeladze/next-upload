import { nextUploadConfig } from '@/app/nextUploadConfig';
import { NextUpload } from 'next-upload';

export const nup = new NextUpload({
  ...nextUploadConfig,
  api: '/upload/basic',
  uploadTypes: {
    ['basic']: {},
  },
});
