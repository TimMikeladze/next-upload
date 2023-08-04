import { UploadToPresignedUrlOptions } from '../types';

export const uploadToPresignedUrl = async (
  options: UploadToPresignedUrlOptions
) => {
  const formData = options.formData || new FormData();

  const { file, postPolicy: signedUrl } = options;

  Object.entries(signedUrl.data || {}).forEach(([key, value]) => {
    formData.append(key, value as any);
  });

  formData.append(`file`, file);

  return fetch(signedUrl.url, {
    body: formData,
    method: `POST`,
    mode: `no-cors`,
    ...options.requestInit,
  });
};
