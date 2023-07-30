import * as Minio from 'minio';
import { nanoid } from 'nanoid';

type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface UploadTypeConfig {
  expirationSeconds?: number;
  maxSizeBytes?: number;
  path?: string;
}

export interface NextUploadConfig {
  minio: Minio.ClientOptions;
  rootBucket: string;
  uploadTypes: {
    [uploadType: string]:
      | ((args: GetSignedUploadUrlArgs) => Promise<UploadTypeConfig>)
      | UploadTypeConfig;
  };
}

export interface GetSignedUploadUrlArgs {
  data?: any;
  id?: string;
  name?: string;
  type: string;
}

export class NextUpload {
  private minio: Minio.Client;

  private rootBucket: string;

  private config: NextUploadConfig;

  constructor(config: NextUploadConfig) {
    this.config = config;
    this.minio = new Minio.Client(config.minio);
    this.rootBucket = config.rootBucket;
  }

  public async init() {
    if (!(await this.minio.bucketExists(this.rootBucket))) {
      await this.minio.makeBucket(this.rootBucket, this.config.minio.region);
    }
  }

  private async makePostPolicy(
    config: RequiredField<UploadTypeConfig, 'path'>
  ) {
    const postPolicy = this.minio.newPostPolicy();

    const minSizeBytes = 1024;

    const { maxSizeBytes = minSizeBytes, expirationSeconds = 60 * 5 } = config;

    postPolicy.setBucket(this.rootBucket);
    postPolicy.setKey(config.path);
    postPolicy.setContentLengthRange(
      minSizeBytes,
      Math.max(maxSizeBytes, minSizeBytes)
    );
    postPolicy.setExpires(new Date(Date.now() + 1000 * expirationSeconds));

    return postPolicy;
  }

  public async generateSignedUploadUrl(args: GetSignedUploadUrlArgs) {
    const { id = nanoid(), type } = args;

    if (!this.config.uploadTypes[type]) {
      throw new Error(`Upload type "${type}" not configured`);
    }

    const config =
      typeof this.config.uploadTypes[type] === 'function'
        ? await (this.config.uploadTypes as any)[type](args)
        : this.config.uploadTypes[type];

    let { path } = config;

    if (!path) {
      path = [args.type, args.id].filter(Boolean).join('/');
    }

    const postPolicy = await this.makePostPolicy({
      ...config,
      path,
    });

    const presignedPostPolicy = await this.minio.presignedPostPolicy(
      postPolicy
    );

    return {
      id,
      data: presignedPostPolicy.formData,
      url: presignedPostPolicy.postURL,
    };
  }
}
