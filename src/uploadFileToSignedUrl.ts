import { UploadFileToSignedUrlOptions } from './types';

export const uploadFileToSignedUrl = async (
  options: UploadFileToSignedUrlOptions
) => {
  const formData = new FormData();

  const { file, signedUrl } = options;

  Object.entries(signedUrl.data || {}).forEach(([key, value]) => {
    formData.append(key, value as any);
  });

  formData.append(`file`, file);

  return fetch(signedUrl.url, {
    body: formData,
    method: `POST`,
    mode: `no-cors`,
  });
};
