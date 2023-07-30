import { GetSignedUrlOptions, SignedUrl } from './types';

export const getSignedUrl = async (
  options: GetSignedUrlOptions
): Promise<SignedUrl> => {
  const res = await fetch(options.nextUpload.getConfig().path, {
    body: JSON.stringify({}),
    ...options.requestInit,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error);
  }

  return json;
};
