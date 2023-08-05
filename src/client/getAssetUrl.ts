import {
  GetAssetUrl,
  GetAssetUrlOptions,
  HandlerAction,
  NextUploadClientConfig,
} from '../types';

export const getAssetUrl = async (
  options: GetAssetUrlOptions,
  config: NextUploadClientConfig
): Promise<GetAssetUrl[]> => {
  const api = config.api || `/upload`;
  const res = await fetch(api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.requestInit?.headers,
    },
    body: JSON.stringify({
      action: HandlerAction.getAssetUrl,
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
