import bytes from 'bytes';
import { type NextRequest, NextResponse } from 'next/server.js';
import { Client, PostPolicy, BucketItem } from 'minio';

import { nanoid } from 'nanoid';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  Asset,
  GetSignedUrlArgs,
  HandlerAction,
  HandlerArgs,
  NextUploadAssetStore,
  NextUploadConfig,
  NextUploadRequest,
  RequiredField,
  SignedUrl,
  UploadTypeConfig,
} from './types';

export class NextUpload {
  private static DEFAULT_TYPE = `default`;

  private client: Client;

  private bucket: string;

  private config: NextUploadConfig;

  private store: NextUploadAssetStore | undefined;

  constructor(config: NextUploadConfig, store?: NextUploadAssetStore) {
    this.config = {
      ...config,
      api: config.api || `/upload`,
    };
    this.client = new Client(config.client);
    this.bucket = config.bucket || NextUpload.bucketFromEnv();

    this.store = store;
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

  public static namespaceFromEnv(project?: string) {
    return NextUpload.bucketFromEnv(project);
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

  private static getDefaultExpirationSeconds() {
    return 60 * 5;
  }

  private async makePostPolicy(
    config: RequiredField<UploadTypeConfig, 'path'>
  ) {
    const postPolicy = this.client.newPostPolicy();

    const {
      maxSize = this.config.maxSize,
      expirationSeconds = this.config.expirationSeconds ||
        NextUpload.getDefaultExpirationSeconds(),
    } = config;

    const maxSizeBytes = bytes.parse(maxSize);

    postPolicy.setBucket(this.bucket);
    postPolicy.setKey(config.path);
    postPolicy.setContentLengthRange(1024, Math.max(maxSizeBytes, 1024));
    postPolicy.setExpires(new Date(Date.now() + 1000 * expirationSeconds));

    return postPolicy;
  }

  public async generateSignedUrl(
    args?: GetSignedUrlArgs,
    request?: NextUploadRequest
  ): Promise<SignedUrl> {
    const { id = nanoid(), type = NextUpload.DEFAULT_TYPE, name } = args || {};

    let uploadTypeConfig: UploadTypeConfig = {};

    if (type === NextUpload.DEFAULT_TYPE) {
      uploadTypeConfig = {};
    } else if (this.config.uploadTypes?.[type]) {
      uploadTypeConfig =
        typeof this.config.uploadTypes[type] === 'function'
          ? await (this.config.uploadTypes[type] as any)(args || {}, request)
          : this.config.uploadTypes[type];
    } else {
      throw new Error(`Upload type "${type}" not configured`);
    }

    let { path } = uploadTypeConfig;

    if (!path) {
      path = [type, id, name].filter(Boolean).join('/');
    }

    let exists = false;

    try {
      if (await this.store?.find(id)) {
        exists = true;
      }
      await this.client.statObject(this.bucket, path);
      exists = true;
    } catch (error) {
      //
    }

    if (exists) {
      throw new Error(`${id} already exists`);
    }

    const verifyAssets =
      uploadTypeConfig.verifyAssets || this.config.verifyAssets;

    const verifyAssetsExpirationSeconds = Number(
      uploadTypeConfig.verifyAssetsExpirationSeconds ||
        this.config.verifyAssetsExpirationSeconds ||
        uploadTypeConfig.expirationSeconds ||
        this.config.expirationSeconds ||
        NextUpload.getDefaultExpirationSeconds()
    );

    if (verifyAssets) {
      if (!this.store) {
        throw new Error(
          `'verifyAssets' config requires NextUpload to be instantiated with a store`
        );
      }
    }

    const postPolicyFn =
      typeof uploadTypeConfig.postPolicy === 'function'
        ? uploadTypeConfig.postPolicy
        : (x: any) => x;

    const postPolicy: PostPolicy = await postPolicyFn(
      await this.makePostPolicy({
        ...uploadTypeConfig,
        path,
      })
    );

    const presignedPostPolicy = await this.client.presignedPostPolicy(
      postPolicy
    );

    await this.store?.upsert?.(
      {
        id,
        type,
        name: '',
        path,
        bucket: this.bucket,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: verifyAssets !== undefined ? !verifyAssets : null,
      },
      verifyAssets ? verifyAssetsExpirationSeconds * 1000 : 0
    );

    return {
      id,
      data: presignedPostPolicy.formData,
      url: presignedPostPolicy.postURL,
    };
  }

  public async pruneAssets() {
    if (!this.store) {
      throw new Error(
        `'pruneAssets' config requires NextUpload to be instantiated with a store`
      );
    }

    const objects = await new Promise<BucketItem[]>((resolve, reject) => {
      const objectsStream = this.client.listObjectsV2(this.bucket, '', true);

      const res: BucketItem[] = [];

      objectsStream.on('data', (obj) => {
        res.push(obj);
      });
      objectsStream.on('end', () => {
        resolve(res);
      });
      objectsStream.on('error', (error) => {
        reject(error);
      });
    });

    const assets: Asset[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const [, value] of this.store.iterator()) {
      assets.push(value);
    }

    const pathsToRemove: string[] = [];

    objects.forEach((object) => {
      const asset = assets.find((a) => a.path === object.name);

      if (!asset || asset.verified === false) {
        pathsToRemove.push(object.name);
      }
    });

    await Promise.all([
      Promise.all(
        pathsToRemove.map((path) => this.client.removeObject(this.bucket, path))
      ),
    ]);
  }

  public async verifyAsset(id: string) {
    if (!this.store) {
      throw new Error(
        `'verifyAsset' config requires NextUpload to be instantiated with a store`
      );
    }

    const foundAsset = await this.store?.find(id);

    if (!foundAsset) {
      throw new Error(`Asset not found`);
    }

    const asset = await this.store?.upsert?.(
      {
        ...foundAsset,
        verified: true,
        updatedAt: new Date(),
      },
      0
    );

    return asset;
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

    const { action, args } = request.body;

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
