import type { Client, ClientOptions, PostPolicy } from 'minio';

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

export interface NextUploadS3Client
  extends Pick<
    Client,
    'bucketExists' | 'makeBucket' | 'newPostPolicy' | 'presignedPostPolicy'
  > {}

export interface NextUploadConfig {
  api: string;
  bucket?: string;
  client: RequiredField<ClientOptions, 'region'>;
  s3Client: () => Promise<NextUploadS3Client>;
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
