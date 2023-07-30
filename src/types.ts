import { ClientOptions } from 'minio';
import { NextUpload } from './NextUpload';

export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;

// eslint-disable-next-line no-shadow
export enum HandlerAction {
  generateSignedUrl = 'generateSignedUrl',
}

export interface HandlerArgs {
  action: HandlerAction;
  data: GetSignedUrlArgs;
}

export interface UploadTypeConfig {
  expirationSeconds?: number;
  maxSizeBytes?: number;
  path?: string;
}

export interface NextUploadConfig {
  bucket?: string;
  client: RequiredField<ClientOptions, 'region'>;
  path: string;
  uploadTypes: {
    [uploadType: string]:
      | ((args: GetSignedUrlArgs) => Promise<UploadTypeConfig>)
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
  nextUpload: NextUpload;
  requestInit?: any;
}

export interface UploadFileToSignedUrlOptions {
  file: File;
  requestInit?: any;
  signedUrl: SignedUrl;
}

export interface SignedUrl {
  data: any;
  id: string;
  url: string;
}
