import { NextUpload } from 'next-upload';
import { NextRequest } from 'next/server';
import { nextUploadConfig } from './config';

const nextUpload = new NextUpload(nextUploadConfig);

export const POST = (request: NextRequest) => nextUpload.POST(request);
