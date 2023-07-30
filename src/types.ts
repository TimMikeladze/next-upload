import type { ClientOptions } from 'minio';
import { NextRequest } from 'next/server';

export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;

// eslint-disable-next-line no-shadow
export enum HandlerAction {
  generateSignedUrl = 'generateSignedUrl',
}

export interface HandlerArgs {
  action: HandlerAction;
  args: GetSignedUrlArgs;
}

export interface UploadTypeConfig {
  expirationSeconds?: number;
  maxSize: number | string;
  path?: string;
}

export interface NextUploadConfig {
  api: string;
  bucket?: string;
  client: RequiredField<ClientOptions, 'region'>;
  uploadTypes: {
    [uploadType: string]:
      | ((
          args: GetSignedUrlArgs,
          request: NextRequest
        ) => Promise<UploadTypeConfig>)
      | UploadTypeConfig;
  };
}

export interface GetSignedUrlArgs {
  data?: any;
  id?: string;
  name?: string;
  type: string;
}

export interface SaveUploadArgs extends GetSignedUrlArgs {}

export interface Storage {
  saveUpload(args: SaveUploadArgs): Promise<string>;
}

export interface GetSignedUrlOptions {
  args: GetSignedUrlArgs;
  config: NextUploadConfig;
  requestInit?: any;
}

export interface UploadToSignedUrlOptions {
  file: File;
  requestInit?: any;
  signedUrl: SignedUrl;
}

export interface SignedUrl {
  data: any;
  id: string;
  url: string;
}

export interface UploadOptions {
  args: GetSignedUrlArgs;
  config: NextUploadConfig;
  file: File;
  requestInit?: any;
}
