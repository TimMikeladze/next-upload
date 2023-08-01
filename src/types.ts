/* eslint-disable max-classes-per-file */
import type {
  BucketItem,
  BucketStream,
  ClientOptions,
  PostPolicy,
  PostPolicyResult,
} from 'minio';
import { NextResponse } from 'next/server.js';

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
  path?: string;
  postPolicy?: (postPolicy: PostPolicy) => Promise<PostPolicy>;
};

export abstract class NextUploadS3Client {
  // eslint-disable-next-line no-useless-constructor, @typescript-eslint/no-unused-vars
  constructor(config: ClientConfig) {
    //
  }

  abstract bucketExists(bucketName: string): Promise<boolean>;

  abstract makeBucket(bucketName: string, region: string): Promise<void>;

  abstract newPostPolicy(): PostPolicy;

  abstract presignedPostPolicy(policy: PostPolicy): Promise<PostPolicyResult>;

  abstract listObjectsV2(
    bucketName: string,
    prefix?: string,
    recursive?: boolean,
    startAfter?: string
  ): BucketStream<BucketItem>;
}
export type Asset = {
  bucket: string;
  createdAt: Date;
  id: string;
  name: string;
  path: string;
  type: string;
  updatedAt: Date;
  verified: boolean;
};

export interface NextUploadAssetStore {
  delete(id: string): Promise<void>;
  find(id: string): Promise<Asset | undefined>;
  upsert(args: Asset, ttl: number): Promise<Asset>;
}

type ClientConfig = RequiredField<ClientOptions, 'region'>;

export type NextUploadConfig = RequiredField<CommonConfig, 'maxSize'> & {
  api?: string;
  bucket?: string;
  client: ClientConfig;
  s3Client?: (config: ClientConfig) => NextUploadS3Client;
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
  data?: any;
  id?: string;
  name?: string;
  type?: string;
};

export type SaveUploadArgs = GetSignedUrlArgs;

export interface Storage {
  saveUpload(args: SaveUploadArgs): Promise<string>;
}

export type GetSignedUrlOptions = GetSignedUrlArgs & {
  requestInit?: any;
};

export type UploadToSignedUrlOptions = {
  file: File;
  formData?: FormData;
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
