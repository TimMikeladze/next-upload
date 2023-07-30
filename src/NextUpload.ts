import { NextResponse, type NextRequest } from 'next/server';
import * as Minio from 'minio';
import { nanoid } from 'nanoid';
import { getNameFromPackageJson } from './getNameFromPackageJson';

type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;

// eslint-disable-next-line no-shadow
export enum HandlerAction {
  generateSignedUploadUrl = 'generateSignedUploadUrl',
}

export interface HandlerArgs {
  action: HandlerAction;
  data: GetSignedUploadUrlArgs;
}

export interface UploadTypeConfig {
  expirationSeconds?: number;
  maxSizeBytes?: number;
  path?: string;
}

export interface NextUploadConfig {
  bucket?: string;
  client: RequiredField<Minio.ClientOptions, 'region'>;
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

export interface SaveUploadArgs extends GetSignedUploadUrlArgs {}

export interface Storage {
  saveUpload(args: SaveUploadArgs): Promise<string>;
}

export class NextUpload {
  private client: Minio.Client;

  private bucket: string;

  private config: NextUploadConfig;

  constructor(config: NextUploadConfig) {
    this.config = config;
    this.client = new Minio.Client(config.client);
    this.bucket = config.bucket || NextUpload.bucketFromEnv();
  }

  public static bucketFromEnv() {
    if (process.env.VERCEL) {
      return NextUpload.bucketFromVercel();
    }

    return [`localhost`, getNameFromPackageJson(), process.env.NODE_ENV].join(
      '/'
    );
  }

  private static bucketFromVercel() {
    return [
      process.env.VERCEL_GIT_REPO_OWNER,
      process.env.VERCEL_GIT_REPO_SLUG,
      process.env.VERCEL_ENV,
    ].join('/');
  }

  public async init() {
    if (!(await this.client.bucketExists(this.bucket))) {
      await this.client.makeBucket(this.bucket, this.config.client.region);
    }
  }

  private async makePostPolicy(
    config: RequiredField<UploadTypeConfig, 'path'>
  ) {
    const postPolicy = this.client.newPostPolicy();

    const minSizeBytes = 1024;

    const { maxSizeBytes = minSizeBytes, expirationSeconds = 60 * 5 } = config;

    postPolicy.setBucket(this.bucket);
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

    const presignedPostPolicy = await this.client.presignedPostPolicy(
      postPolicy
    );

    return {
      id,
      data: presignedPostPolicy.formData,
      url: presignedPostPolicy.postURL,
    };
  }

  // public async saveUpload(args: SaveUploadArgs) {}

  // public async pruneUploads() {
  //   //
  // }

  public async handler(request: NextRequest) {
    const { body } = request;

    if (!body) {
      return NextResponse.json({ error: `No body` }, { status: 400 });
    }

    const { action, data } = body as unknown as HandlerArgs;

    if (!action) {
      return NextResponse.json({ error: `No action` }, { status: 400 });
    }

    await this.init();

    try {
      switch (action) {
        case HandlerAction.generateSignedUploadUrl: {
          const res = await this.generateSignedUploadUrl(data);
          return NextResponse.json(res);
        }
        default: {
          return NextResponse.json(
            { error: `Unknown action "${action}"` },
            { status: 400 }
          );
        }
      }
    } catch (error) {
      return NextResponse.json(
        { error: (error as any).message },
        { status: 500 }
      );
    }
  }
}
