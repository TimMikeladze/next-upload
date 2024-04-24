import {
  GeneratePresigned,
  GeneratePresignedOptions,
  NextUploadAction,
  NextUploadClientConfig,
} from '../types';

export const generatePresigned = async (
  options: GeneratePresignedOptions,
  config: NextUploadClientConfig
): Promise<GeneratePresigned> => {
  const api = config.api || `/upload`;
  const res = await fetch(api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.requestInit?.headers,
    },
    body: JSON.stringify({
      action: NextUploadAction.generatePresigned,
      input: options.args,
      ...options.requestInit?.body,
    }),
    ...options.requestInit,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error);
  }

  return json?.data;
};
