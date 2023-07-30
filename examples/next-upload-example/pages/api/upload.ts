import { NextUpload } from 'next-upload';

import { NextApiHandler } from 'next';
import { nextUploadConfig } from '@/app/upload/config';

const nextUpload = new NextUpload({
  ...nextUploadConfig,
  api: `/api/upload`,
});

const handler: NextApiHandler = (req, res) =>
  nextUpload.pagesApiHandler(req, res);

export default handler;
