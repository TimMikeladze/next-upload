import { NextUpload } from 'next-upload';
import { NextUploadPrismaStore } from 'next-upload/store/prisma';

import { nextUploadConfig } from '@/app/nextUploadConfig';
import { prisma } from '@/prisma/client';

export const nup = new NextUpload(
  nextUploadConfig,
  new NextUploadPrismaStore(prisma)
);
