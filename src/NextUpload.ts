import { NextResponse, type NextRequest } from 'next/server';
import { Client } from 'minio';

import { nanoid } from 'nanoid';
import { getNameFromPackageJson } from './getNameFromPackageJson';
import {
  GetSignedUrlArgs,
  HandlerAction,
  HandlerArgs,
  NextUploadConfig,
  RequiredField,
  SignedUrl,
  UploadTypeConfig,
} from './types';

export class NextUpload {
  private client: Client;

  private bucket: string;

  private config: NextUploadConfig;

  constructor(config: NextUploadConfig) {
    this.config = config;
    this.client = new Client(config.client);
    this.bucket = config.bucket || NextUpload.bucketFromEnv();
  }

  public getBucket() {
    return this.bucket;
  }

  public getClient() {
    return this.client;
  }

  public getConfig() {
    return this.config;
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

  public async generateSignedUrl(args: GetSignedUrlArgs): Promise<SignedUrl> {
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
        case HandlerAction.generateSignedUrl: {
          const res = await this.generateSignedUrl(data);
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
