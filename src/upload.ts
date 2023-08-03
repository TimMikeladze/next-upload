import { generatePresignedPostPolicy } from './generatePresignedPostPolicy';
import { NextUploadConfig, UploadOptions } from './types';
import { uploadToPresignedUrl } from './uploadToPresignedUrl';

export const upload = async (
  options: UploadOptions | UploadOptions[],
  config: NextUploadConfig
) => {
  let optionsArray = Array.isArray(options) ? options : [options];

  optionsArray = optionsArray
    .map((x) => {
      if (!x.file) {
        throw new Error(`options.file is required`);
      }
      return x;
    })
    .map((x) => ({
      ...x,
      name: x.name || x.file.name,
      fileType: x.file.type,
    }));

  return Promise.all(
    optionsArray.map(async (x) => {
      const { requestInit, file, ...args } = x;
      const signedUrl = await generatePresignedPostPolicy(
        {
          args,
          requestInit,
        },
        config
      );

      await uploadToPresignedUrl({
        file,
        requestInit,
        postPolicy: signedUrl,
        metadata: x.metadata,
      });

      return signedUrl;
    })
  );
};
