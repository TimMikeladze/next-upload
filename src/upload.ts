import { getSignedUrl } from './getSignedUrl';
import { UploadOptions } from './types';
import { uploadToSignedUrl } from './uploadToSignedUrl';

export const upload = async (options: UploadOptions) => {
  const signedUrl = await getSignedUrl(options);

  const res = await uploadToSignedUrl({
    file: options.file,
    signedUrl,
    requestInit: options.requestInit,
  });

  return res;
};
