import { NextUpload } from 'next-upload';
import { config } from './config';
import { NextRequest } from 'next/server';

const nup = new NextUpload(config);

export const POST = (request: NextRequest) => nup.handler(request);
