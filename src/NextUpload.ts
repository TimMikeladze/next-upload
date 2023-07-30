import bytes from 'bytes';
import { type NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';

import { nanoid } from 'nanoid';
import { NextApiRequest, NextApiResponse } from 'next';
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
    this.client = new Client(this.config.client);
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

    const { maxSize, expirationSeconds = 60 * 5 } = config;

    const maxSizeBytes = bytes.parse(maxSize);

    postPolicy.setBucket(this.bucket);
    postPolicy.setKey(config.path);
    postPolicy.setContentLengthRange(1024, Math.max(maxSizeBytes, 1024));
    postPolicy.setExpires(new Date(Date.now() + 1000 * expirationSeconds));

    return postPolicy;
  }

  public async generateSignedUrl(
    args: GetSignedUrlArgs,
    headers: Headers,
    body: any
  ): Promise<SignedUrl> {
    const { id = nanoid(), type, name } = args;

    if (!type) {
      throw new Error(`Upload type not specified`);
    }

    if (!this.config.uploadTypes[type]) {
      throw new Error(`Upload type "${type}" not configured`);
    }

    const config =
      typeof this.config.uploadTypes[type] === 'function'
        ? await (this.config.uploadTypes[type] as any)(args, headers, body)
        : this.config.uploadTypes[type];

    let { path } = config;

    if (!path) {
      path = [type, id, name].filter(Boolean).join('/');
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

  public async POST(request: NextRequest) {
    // @ts-ignore
    const { json } = NextResponse.default;

    const body = await request.json();

    return this.handler(json, request.headers, body);
  }

  public async pagesApiHandler(
    request: NextApiRequest,
    response: NextApiResponse
  ) {
    const { body, headers } = request;

    const json = (data: any, options?: { status?: number }) => {
      response.status(options?.status || 200).json(data);
    };

    return this.handler(json, headers as any, body);
  }

  private async handler(
    json: (data: any, options?: { status?: number }) => void,
    headers: Headers,
    body: {
      [key: string]: any;
    }
  ) {
    if (!body) {
      return json({ error: `No body` }, { status: 400 });
    }

    const { action, args } = body as unknown as HandlerArgs;

    if (!action) {
      return json({ error: `No action` }, { status: 400 });
    }

    if (!args?.type) {
      return json({ error: `No type` }, { status: 400 });
    }

    await this.init();

    try {
      switch (action) {
        case HandlerAction.generateSignedUrl: {
          const res = await this.generateSignedUrl(args, headers, body);
          return json(res);
        }
        default: {
          return json({ error: `Unknown action "${action}"` }, { status: 400 });
        }
      }
    } catch (error) {
      return json({ error: (error as any).message }, { status: 500 });
    }
  }
}
