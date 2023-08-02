/* eslint-disable max-classes-per-file */
import type { ClientOptions, PostPolicy } from 'minio';
import { NextResponse } from 'next/server.js';

export type Metadata = Record<string, string | number>;

export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;

// eslint-disable-next-line no-shadow
export enum HandlerAction {
  generateSignedUrl = 'generateSignedUrl',
}

export type SendFn = <JsonBody>(
  body: JsonBody,
  init?: { status?: number }
) => NextResponse<JsonBody> | Promise<void>;

export type HandlerArgs = {
  request: NextUploadRequest;
  send: SendFn;
};

type CommonConfig = {
  expirationSeconds?: number;
  maxSize?: number | string;
  verifyAssets?: boolean;
  verifyAssetsExpirationSeconds?: number;
};

export type UploadTypeConfig = CommonConfig & {
  metadata?: Metadata;
  path?: string;
  postPolicy?: (postPolicy: PostPolicy) => Promise<PostPolicy>;
};

export type Asset = {
  bucket: string;
  createdAt: Date;
  fileType: string;
  id: string;
  metadata: Metadata;
  name: string;
  path: string;
  updatedAt: Date;
  uploadType: string;
  verified: boolean | null;
};

export interface NextUploadAssetStore {
  delete(id: string): Promise<void>;
  find(id: string): Promise<Asset | undefined>;
  iterator(): AsyncGenerator<any, void, any>;
  upsert(args: Asset, ttl: number): Promise<Asset>;
}

type ClientConfig = RequiredField<ClientOptions, 'region'>;

export type NextUploadConfig = RequiredField<CommonConfig, 'maxSize'> & {
  api?: string;
  bucket?: string;
  client: ClientConfig;
  uploadTypes?: {
    [uploadType: string]:
      | ((
          args: GetSignedUrlArgs,
          request: NextUploadRequest
        ) => Promise<UploadTypeConfig>)
      | UploadTypeConfig;
  };
};

export type NextUploadRequest = {
  body?: any;
  headers?: Headers;
};

export type GetSignedUrlArgs = {
  fileType?: string;
  id?: string;
  metadata?: any;
  name?: string;
  uploadType?: string;
};

export type SaveUploadArgs = GetSignedUrlArgs;

export interface Storage {
  saveUpload(args: SaveUploadArgs): Promise<string>;
}

export type GetSignedUrlOptions = {
  args?: GetSignedUrlArgs;
  requestInit?: any;
};

export type UploadToSignedUrlOptions = {
  file: File;
  formData?: FormData;
  metadata?: Metadata;
  requestInit?: any;
  signedUrl: SignedUrl;
};

export type SignedUrl = {
  data: any;
  id: string;
  url: string;
};

export type UploadOptions = GetSignedUrlArgs & {
  file: File;
  requestInit?: any;
};
