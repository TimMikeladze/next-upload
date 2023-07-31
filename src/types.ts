import type { ClientOptions, PostPolicy, PostPolicyResult } from 'minio';

export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;

// eslint-disable-next-line no-shadow
export enum HandlerAction {
  generateSignedUrl = 'generateSignedUrl',
}

export interface HandlerArgs {
  request: NextUploadRequest;
  send: (data: any, options?: { status?: number }) => Promise<void>;
}

export interface UploadTypeConfig {
  expirationSeconds?: number;
  maxSize: number | string;
  path?: string;
  postPolicy?: (postPolicy: PostPolicy) => Promise<PostPolicy>;
}

export abstract class NextUploadS3Client {
  // eslint-disable-next-line no-useless-constructor, @typescript-eslint/no-unused-vars
  constructor(config: ClientConfig) {
    //
  }

  abstract bucketExists(bucketName: string): Promise<boolean>;

  abstract makeBucket(bucketName: string, region: string): Promise<void>;

  abstract newPostPolicy(): PostPolicy;

  abstract presignedPostPolicy(policy: PostPolicy): Promise<PostPolicyResult>;
}

type ClientConfig = RequiredField<ClientOptions, 'region'>;

export interface NextUploadConfig {
  api: string;
  bucket?: string;
  client: ClientConfig;
  s3Client?: (config: ClientConfig) => NextUploadS3Client;
  uploadTypes: {
    [uploadType: string]:
      | ((
          args: GetSignedUrlArgs,
          request: NextUploadRequest
        ) => Promise<UploadTypeConfig>)
      | UploadTypeConfig;
  };
}

export interface NextUploadRequest {
  body?: any;
  headers?: Headers;
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
  formData?: FormData;
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
