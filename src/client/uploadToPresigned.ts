import { UploadToPresignedOptions } from '../types';

export const uploadToPresignedUrl = async (
  options: UploadToPresignedOptions
) => {
  const formData = options.formData || new FormData();

  const { file, postPolicy, signedUrl } = options;

  if (!file) {
    throw new Error(`file is required`);
  }

  if (postPolicy) {
    Object.entries(postPolicy.data || {}).forEach(([key, value]) => {
      formData.append(key, value as any);
    });

    formData.append(`file`, file);

    return fetch(postPolicy.url, {
      body: formData,
      method: `POST`,
      mode: `no-cors`,
      ...options.requestInit,
    });
  }

  if (signedUrl) {
    await fetch(signedUrl.url, {
      body: file,
      method: `PUT`,
      ...options.requestInit,
    });
  }
  throw new Error(`postPolicy or signedUrl is required`);
};
