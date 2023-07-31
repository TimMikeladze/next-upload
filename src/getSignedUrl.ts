import { GetSignedUrlOptions, HandlerAction, SignedUrl } from './types';

export const getSignedUrl = async (
  options: GetSignedUrlOptions
): Promise<SignedUrl> => {
  const { config } = options;

  if (!config?.api) {
    throw new Error(`config.api is required`);
  }

  const res = await fetch(config.api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.requestInit?.headers,
    },
    body: JSON.stringify({
      action: HandlerAction.generateSignedUrl,
      ...options,
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
