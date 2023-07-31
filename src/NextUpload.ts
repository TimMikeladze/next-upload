import bytes from 'bytes';
import { type NextRequest, NextResponse } from 'next/server.js';
import { Client, PostPolicy } from 'minio';

import { nanoid } from 'nanoid';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  GetSignedUrlArgs,
  HandlerAction,
  HandlerArgs,
  NextUploadConfig,
  NextUploadRequest,
  NextUploadS3Client,
  RequiredField,
  SignedUrl,
  UploadTypeConfig,
} from './types';

export class NextUpload {
  private static DEFAULT_TYPE = `default`;

  private client: NextUploadS3Client;

  private bucket: string;

  private config: NextUploadConfig;

  constructor(config: NextUploadConfig) {
    this.config = {
      ...config,
      api: config.api || `/upload`,
    };
    this.client = config.s3Client
      ? config.s3Client(config.client)
      : new Client(config.client);
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

  public static bucketFromEnv(project?: string) {
    if (process.env.VERCEL) {
      return NextUpload.bucketFromVercel();
    }

    return [`localhost`, project, process.env.NODE_ENV]
      .filter(Boolean)
      .join('-');
  }

  private static bucketFromVercel() {
    return [
      process.env.VERCEL_GIT_REPO_OWNER,
      process.env.VERCEL_GIT_REPO_SLUG,
      process.env.VERCEL_ENV,
    ].join('-');
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

    const {
      maxSize = this.config.maxSize,
      expirationSeconds = this.config.expirationSeconds || 60 * 5,
    } = config;

    const maxSizeBytes = bytes.parse(maxSize);

    postPolicy.setBucket(this.bucket);
    postPolicy.setKey(config.path);
    postPolicy.setContentLengthRange(1024, Math.max(maxSizeBytes, 1024));
    postPolicy.setExpires(new Date(Date.now() + 1000 * expirationSeconds));

    return postPolicy;
  }

  public async generateSignedUrl(
    args: GetSignedUrlArgs,
    request: NextUploadRequest
  ): Promise<SignedUrl> {
    const { id = nanoid(), type = NextUpload.DEFAULT_TYPE, name } = args;

    let config: UploadTypeConfig = {};

    if (type === NextUpload.DEFAULT_TYPE) {
      config = {};
    } else if (this.config.uploadTypes?.[type]) {
      config =
        typeof this.config.uploadTypes[type] === 'function'
          ? await (this.config.uploadTypes[type] as any)(args, request)
          : this.config.uploadTypes[type];
    } else {
      throw new Error(`Upload type "${type}" not configured`);
    }

    let { path } = config;

    if (!path) {
      path = [type, id, name].filter(Boolean).join('/');
    }

    const postPolicyFn =
      typeof config.postPolicy === 'function'
        ? config.postPolicy
        : (x: any) => x;

    const postPolicy: PostPolicy = await postPolicyFn(
      await this.makePostPolicy({
        ...config,
        path,
      })
    );

    const presignedPostPolicy = await this.client.presignedPostPolicy(
      postPolicy
    );

    return {
      id,
      data: presignedPostPolicy.formData,
      url: presignedPostPolicy.postURL,
    };
  }

  public async handler(request: NextRequest) {
    const body = await request.json();

    return this.rawHandler({
      send: NextResponse.json,
      request: {
        body,
        headers: request.headers,
      },
    });
  }

  public async pagesApiHandler(
    request: NextApiRequest,
    response: NextApiResponse
  ) {
    const { body, headers } = request;

    const json = async (data: any, options?: { status?: number }) =>
      response.status(options?.status || 200).json(data);

    return this.rawHandler({
      send: json,
      request: {
        body,
        headers: headers as any,
      },
    });
  }

  public async rawHandler(handlerArgs: HandlerArgs) {
    const { send, request } = handlerArgs;

    if (!request.body) {
      return send({ error: `No body` }, { status: 400 });
    }

    const { action, args = {} } = request.body;

    if (!action) {
      return send({ error: `No action` }, { status: 400 });
    }

    await this.init();

    try {
      switch (action) {
        case HandlerAction.generateSignedUrl: {
          const res = await this.generateSignedUrl(args, request);

          return send(res);
        }
        default: {
          return send({ error: `Unknown action "${action}"` }, { status: 400 });
        }
      }
    } catch (error) {
      console.error(error);
      return send({ error: (error as any).message }, { status: 500 });
    }
  }
}
