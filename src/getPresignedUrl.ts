import {
  GetPresignedUrl,
  GetPresignedUrlOptions,
  HandlerAction,
  NextUploadClientConfig,
} from './types';

export const getPresignedUrl = async (
  options: GetPresignedUrlOptions,
  config: NextUploadClientConfig
): Promise<GetPresignedUrl[]> => {
  const api = config.api || `/upload`;
  const res = await fetch(api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.requestInit?.headers,
    },
    body: JSON.stringify({
      action: HandlerAction.getPresignedUrl,
      args: options.args,
      ...options.requestInit?.body,
    }),
    ...options.requestInit,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error);
  }

  return json;
};
