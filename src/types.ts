/* eslint-disable max-classes-per-file */
import { NextToolConfig } from 'next-tool';
import { S3ClientConfig } from '@aws-sdk/client-s3';
import { PresignedPostOptions } from '@aws-sdk/s3-presigned-post';

export type Metadata = Record<string, string | number>;

export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;

// eslint-disable-next-line no-shadow
export enum NextUploadAction {
  deleteAsset = 'deleteAsset',
  generatePresignedPostPolicy = 'generatePresignedPostPolicy',
  getAsset = 'getAsset',
  pruneAssets = 'pruneAssets',
  verifyAsset = 'verifyAsset',
}

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
  postPolicy?: (
    postPolicy: PresignedPostOptions
  ) => Promise<PresignedPostOptions>;
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

export interface NextUploadStore {
  all(): Promise<Asset[]>;
  delete(id: string): Promise<void>;
  deletePresignedUrl(id: string): Promise<void>;
  find(id: string): Promise<Asset | undefined>;
  getPresignedUrl(id: string): Promise<{
    presignedUrl?: string | null;
    presignedUrlExpires?: number | null;
  } | null>;
  savePresignedUrl(
    id: string,
    url: string,
    presignedUrlExpirationSeconds?: number
  ): Promise<void>;
  upsert(args: Asset, ttl: number): Promise<Asset>;
}

type ClientConfig = S3ClientConfig;

export type UploadTypeConfigFn = (
  args: Partial<GeneratePresignedPostPolicyArgs & GetAssetArgs>,
  request?: NextUploadRequest
) => Promise<UploadTypeConfig>;

export type NextUploadConfig = NextToolConfig &
  RequiredField<CommonConfig, 'maxSize'> & {
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

export type GetAssetOptions = {
  args?: GetAssetArgs;
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

export type GetAssetArgs = {
  expiry?: number;
  id?: string;
  path?: string | null;
  reqParams?: { [key: string]: any };
  requestDate?: Date;
};

export type GetAsset = {
  id: string;
  metadata?: Metadata | null;
  url: string;
};

export type VerifyAssetArgs = {
  id?: string;
  path?: string;
};

export type DeleteArgs = {
  id?: string;
  path?: string | null;
};
