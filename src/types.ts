/* eslint-disable max-classes-per-file */
import type { ClientOptions, PostPolicy } from 'minio';
import { NextResponse } from 'next/server.js';

export type Metadata = Record<string, string | number>;

export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;

// eslint-disable-next-line no-shadow
export enum HandlerAction {
  generatePresignedPostPolicy = 'generatePresignedPostPolicy',
  getPresignedUrl = 'getPresignedUrl',
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
  includeMetadataInSignedUrlResponse?: boolean;
  includeObjectPathInPostPolicyResponse?: boolean;
  maxSize?: number | string;
  postPolicyExpirationSeconds?: number;
  presignedUrlExpirationSeconds?: number;
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
  expires?: number | null;
  fileType: string;
  id: string;
  metadata: Metadata;
  name: string;
  path: string;
  updatedAt: Date;
  uploadType: string;
  verified: boolean | null;
};

export interface AssetStore {
  all(): Promise<Asset[]>;
  delete(id: string): Promise<void>;
  find(id: string): Promise<Asset | undefined>;
  upsert(args: Asset, ttl: number): Promise<Asset>;
}

type ClientConfig = RequiredField<ClientOptions, 'region'>;

export type UploadTypeConfigFn = (
  args: Partial<GeneratePresignedPostPolicyArgs & GetPresignedUrlArgs>,
  request?: NextUploadRequest
) => Promise<UploadTypeConfig>;

export type GetStoreFn = () => Promise<AssetStore | undefined>;

export type NextUploadConfig = RequiredField<CommonConfig, 'maxSize'> & {
  api?: string;
  bucket?: string;
  client: ClientConfig;
  uploadTypes?: {
    [uploadType: string]: UploadTypeConfigFn | UploadTypeConfig;
  };
};

export type NextUploadClientConfig = Pick<NextUploadConfig, 'api'>;

export type NextUploadRequest = {
  body?: any;
  headers?: Headers;
};

export type GeneratePresignedPostPolicyArgs = {
  fileType?: string;
  id?: string;
  metadata?: any;
  name?: string;
  uploadType?: string;
};

export type SaveUploadArgs = GeneratePresignedPostPolicyArgs;

export interface Storage {
  saveUpload(args: SaveUploadArgs): Promise<string>;
}

export type GeneratePresignedPostPolicyOptions = {
  args?: GeneratePresignedPostPolicyArgs;
  requestInit?: any;
};

export type GetPresignedUrlOptions = {
  args?: GetPresignedUrlArgs;
  requestInit?: any;
};

export type UploadToPresignedUrlOptions = {
  file: File;
  formData?: FormData;
  metadata?: Metadata;
  postPolicy: SignedPostPolicy;
  requestInit?: any;
};

export type SignedPostPolicy = {
  data: any;
  id: string;
  path: string | null;
  url: string;
};

export type UploadOptions = GeneratePresignedPostPolicyArgs & {
  file: File;
  requestInit?: any;
};

export type GetPresignedUrlArgs = {
  expiry?: number;
  id?: string;
  path?: string;
  reqParams?: { [key: string]: any };
  requestDate?: Date;
};

export type GetPresignedUrl = {
  id: string;
  metadata?: Metadata | null;
  url: string;
};

export type VerifyAssetArgs = {
  id?: string;
  path?: string;
};
