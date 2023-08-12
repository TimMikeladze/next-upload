import bytes from 'bytes';
import { Client, PostPolicy, BucketItem } from 'minio';

import { nanoid } from 'nanoid';
import { NextTool, NextToolStorePromise } from 'next-tool';
import {
  NextUploadAction,
  Asset,
  GetAsset,
  GetAssetArgs,
  GeneratePresignedPostPolicyArgs,
  NextUploadStore,
  NextUploadConfig,
  NextUploadRequest,
  RequiredField,
  UploadTypeConfig,
  VerifyAssetArgs,
  UploadTypeConfigFn,
  DeleteArgs as DeleteAssetArgs,
  SignedPostPolicy,
} from './types';

export const defaultEnabledHandlerActions = [
  NextUploadAction.generatePresignedPostPolicy,
  NextUploadAction.getAsset,
];

export class NextUpload extends NextTool<NextUploadConfig, NextUploadStore> {
  private static DEFAULT_TYPE = `default`;

  private client: Client;

  private bucket: string;

  constructor(
    config: NextUploadConfig,
    store?: NextToolStorePromise<NextUploadStore> | NextUploadStore
  ) {
    super(
      {
        actions: {
          [NextUploadAction.generatePresignedPostPolicy]: {},
          [NextUploadAction.getAsset]: {},
        },
        ...config,
      },
      store,
      {
        [NextUploadAction.generatePresignedPostPolicy]: (args, request) =>
          this.generatePresignedPostPolicy(args, request),
        [NextUploadAction.getAsset]: (args, request) =>
          this.getAsset(args, request),
        [NextUploadAction.deleteAsset]: (args) => this.deleteAsset(args),
        [NextUploadAction.verifyAsset]: (args) => this.verifyAsset(args),
        [NextUploadAction.pruneAssets]: () => this.pruneAssets(),
      }
    );
    this.client = new Client(config.client);
    this.bucket = config.bucket || NextUpload.bucketFromEnv();
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
      .join('-')
      .toLowerCase();
  }

  private static bucketFromVercel() {
    return [
      process.env.VERCEL_GIT_REPO_OWNER,
      process.env.VERCEL_GIT_REPO_SLUG,
      process.env.VERCEL_ENV,
    ]
      .join('-')
      .toLowerCase();
  }

  private static getDefaultPostPolicyExpirationSeconds() {
    return 60 * 5;
  }

  public static getIdFromPath(path: string) {
    return path.split('/').slice(-2)[0];
  }

  public static getUploadTypeFromPath(path: string) {
    return path.split('/').slice(-3)[0];
  }

  public static calculateExpires(ttl: number) {
    if (!ttl) {
      return null;
    }
    return new Date(Date.now() + ttl).getTime();
  }

  public static isExpired(timestamp: number | null | undefined) {
    if (!timestamp) {
      return false;
    }
    return timestamp && timestamp < Date.now();
  }

  public getBucket() {
    return this.bucket;
  }

  public getClient() {
    return this.client;
  }

  public async init() {
    await super.init();
    if (!(await this.client.bucketExists(this.bucket))) {
      await this.client.makeBucket(this.bucket, this.config.client.region);
    }
  }

  private async makePostPolicy(
    config: RequiredField<UploadTypeConfig, 'path'>,
    {
      fileType,
      // metadata,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      id,
    }: {
      fileType: string;
      id: string;
      // metadata: Metadata;
    }
  ) {
    const postPolicy = this.client.newPostPolicy();

    const {
      maxSize = this.config.maxSize,
      postPolicyExpirationSeconds = this.config.postPolicyExpirationSeconds ||
        NextUpload.getDefaultPostPolicyExpirationSeconds(),
    } = config;

    const maxSizeBytes = bytes.parse(maxSize);

    postPolicy.setBucket(this.bucket);
    postPolicy.setKey(config.path);
    postPolicy.setContentLengthRange(1, Math.max(maxSizeBytes, 1024));
    postPolicy.setExpires(
      new Date(Date.now() + 1000 * postPolicyExpirationSeconds)
    );
    postPolicy.setContentType(fileType);
    // if (metadata && Object.keys(metadata).length > 0) {
    //   postPolicy.setUserMetaData(metadata);
    //   postPolicy.setContentDisposition(`attachment; filename=${id}`);
    // }

    return postPolicy;
  }

  public async generatePresignedPostPolicy(
    args: GeneratePresignedPostPolicyArgs,
    request?: NextUploadRequest
  ): Promise<{
    postPolicy: SignedPostPolicy;
  }> {
    const {
      id = nanoid(),
      uploadType = NextUpload.DEFAULT_TYPE,
      name,
      metadata = {},
      fileType,
    } = args || {};

    if (!fileType) {
      throw new Error(`fileType is required`);
    }

    const getConfig = async (valueOrFn: any): Promise<UploadTypeConfig> => {
      if (typeof valueOrFn === 'function') {
        return valueOrFn(args || {}, request);
      }

      return valueOrFn;
    };

    const defaultUploadTypeConfig = await getConfig(
      this.config.uploadTypes?.[NextUpload.DEFAULT_TYPE] || {}
    );

    if (
      uploadType !== NextUpload.DEFAULT_TYPE &&
      !this.config.uploadTypes?.[uploadType]
    ) {
      throw new Error(`Upload type "${uploadType}" not configured`);
    }

    const uploadTypeConfig =
      uploadType !== NextUpload.DEFAULT_TYPE
        ? await getConfig(this.config.uploadTypes?.[uploadType])
        : defaultUploadTypeConfig;

    let { path } = uploadTypeConfig;

    const includeObjectPathInPostPolicyResponse =
      uploadTypeConfig.includeObjectPathInPostPolicyResponse !== undefined
        ? uploadTypeConfig.includeObjectPathInPostPolicyResponse
        : this.config.includeObjectPathInPostPolicyResponse;

    if (!path) {
      path = [uploadType, id, name].filter(Boolean).join('/');
    }

    let exists = false;

    const mergedMetadata = {
      ...metadata,
      ...uploadTypeConfig.metadata,
    };

    if (Object.keys(mergedMetadata).length && !this.store) {
      throw new Error(
        `saving metadata requires NextUpload to be instantiated with a store`
      );
    }

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
        uploadTypeConfig.postPolicyExpirationSeconds ||
        this.config.postPolicyExpirationSeconds ||
        NextUpload.getDefaultPostPolicyExpirationSeconds()
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

    if (!args?.fileType) {
      throw new Error(`fileType is required`);
    }

    const postPolicy: PostPolicy = await postPolicyFn(
      await this.makePostPolicy(
        {
          ...uploadTypeConfig,
          path,
        },
        {
          id,
          fileType,
        }
      )
    );

    const presignedPostPolicy = await this.client.presignedPostPolicy(
      postPolicy
    );

    await this.store?.upsert?.(
      {
        id,
        path,
        name: '',
        bucket: this.bucket,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: verifyAssets !== undefined ? !verifyAssets : null,
        metadata: mergedMetadata,
        fileType,
        uploadType,
      },
      verifyAssets ? verifyAssetsExpirationSeconds * 1000 : 0
    );

    return {
      postPolicy: {
        id,
        data: presignedPostPolicy.formData,
        url: presignedPostPolicy.postURL,
        path: includeObjectPathInPostPolicyResponse ? path : null,
      },
    };
  }

  public async pruneAssets(): Promise<boolean> {
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

    const assets: Asset[] = await this.store.all();

    const pathsToRemove: string[] = [];
    const assetIdsToRemove: string[] = [];

    objects.forEach((object) => {
      const asset = assets.find((a) => a.path === object.name);

      if (!asset || asset.verified === false) {
        pathsToRemove.push(object.name);
        if (asset) {
          assetIdsToRemove.push(asset.id);
        }
      }
    });

    await Promise.all(
      pathsToRemove.map((path) => this.client.removeObject(this.bucket, path))
    );

    await Promise.all(assetIdsToRemove.map((id) => this.store?.delete(id)));

    return true;
  }

  public async verifyAsset(args: VerifyAssetArgs | VerifyAssetArgs[]): Promise<{
    asset: Asset;
    assets: Asset[];
  }> {
    if (!this.store) {
      throw new Error(
        `'verifyAsset' config requires NextUpload to be instantiated with a store`
      );
    }

    const data = Array.isArray(args) ? args : [args];

    // confirm all assets have id or path
    data.forEach((x) => {
      if (!x.id && !x.path) {
        throw new Error(`id or path is required`);
      }
    });

    const assets = await Promise.all(
      data.map(async (x) => {
        const id = x.id || NextUpload.getIdFromPath(x.path as string);
        const foundAsset = await this.store?.find(id);

        if (!foundAsset) {
          throw new Error(`Asset not found`);
        }

        const asset = await this.store!.upsert(
          {
            ...foundAsset,
            verified: true,
            updatedAt: new Date(),
          },
          0
        );

        return asset;
      })
    );

    return {
      asset: assets?.[0],
      assets,
    };
  }

  public async deleteAsset(
    args: DeleteAssetArgs | DeleteAssetArgs[]
  ): Promise<boolean> {
    const data = Array.isArray(args) ? args : [args];

    await Promise.all(
      data.map(async (x) => {
        let asset: Asset | undefined;

        let { path } = x;

        const id = x.id || NextUpload.getIdFromPath(path as string);

        if (!id && !path) {
          throw new Error(`id or path is required`);
        }

        if (!path) {
          if (!this.store) {
            throw new Error(
              `'id' argument requires NextUpload to be instantiated with a store. Alternatively, you can pass a 'path' argument.`
            );
          }
          asset = await this.store.find(id);
          path = asset?.path;

          if (!path) {
            throw new Error(`Asset not found`);
          }
        }

        if (this.store) {
          await this.store.delete(id);
        }

        await this.client.removeObject(this.bucket, path);
      })
    );

    return true;
  }

  public async getAsset(
    args: GetAssetArgs | GetAssetArgs[],
    request?: NextUploadRequest
  ): Promise<{ asset: GetAsset; assets: GetAsset[] }> {
    const data = Array.isArray(args) ? args : [args];

    const assets = await Promise.all(
      data.map(async (x) => {
        let asset: Asset | undefined;

        let { path } = x;

        const id = x.id || NextUpload.getIdFromPath(path as string);

        if (!id && !path) {
          throw new Error(`id or path is required`);
        }

        if (!path) {
          if (!this.store) {
            throw new Error(
              `'id' argument requires NextUpload to be instantiated with a store. Alternatively, you can pass a 'path' argument.`
            );
          }
          asset = await this.store.find(id);
          path = asset?.path;

          if (!path) {
            throw new Error(`Asset not found`);
          }
        }

        try {
          const stat = await this.client.statObject(this.bucket, path);
          if (!stat) {
            throw new Error(`Not found`);
          }
        } catch {
          throw new Error(`Not found`);
        }

        const uploadType = NextUpload.getUploadTypeFromPath(path);

        let configFnOrValue = this.config.uploadTypes?.[uploadType];

        if (!configFnOrValue) {
          if (uploadType !== NextUpload.DEFAULT_TYPE) {
            throw new Error(`Upload type "${uploadType}" not configured`);
          } else {
            configFnOrValue = {};
          }
        }

        const config = await (typeof configFnOrValue === 'function'
          ? (configFnOrValue as UploadTypeConfigFn)(x, request)
          : (configFnOrValue as UploadTypeConfig));

        const presignedUrlExpirationSeconds =
          config.presignedUrlExpirationSeconds ||
          this.config.presignedUrlExpirationSeconds ||
          604800; /* 7 days */

        const includeMetadataInSignedUrlResponse =
          config.includeMetadataInSignedUrlResponse ||
          this.config.includeMetadataInSignedUrlResponse;

        if (includeMetadataInSignedUrlResponse) {
          if (!this.store) {
            throw new Error(
              `'includeMetadataInSignedUrlResponse' config requires NextUpload to be instantiated with a store`
            );
          }
          asset = asset || (await this.store.find(id));

          if (!asset) {
            throw new Error(`Asset not found`);
          }
        }

        const makePresignedUrl = async () =>
          presignedUrlExpirationSeconds
            ? this.client.presignedUrl(
                `GET`,
                this.bucket,
                path as string,
                presignedUrlExpirationSeconds
              )
            : this.client.presignedUrl(`GET`, this.bucket, path as string);

        let url: string = '';

        if (this.store) {
          const found = await this.store.getPresignedUrl(id);

          if (found && NextUpload.isExpired(found.presignedUrlExpires)) {
            await this.store.deletePresignedUrl(id);
          }

          if (
            !found ||
            !found?.presignedUrl ||
            NextUpload.isExpired(found.presignedUrlExpires)
          ) {
            url = await makePresignedUrl();
            await this.store.savePresignedUrl(
              id,
              url,
              presignedUrlExpirationSeconds
            );
          } else if (found) {
            url = found.presignedUrl;
          }
        } else {
          url = await makePresignedUrl();
        }

        const res: GetAsset = {
          id,
          url,
        };

        if (includeMetadataInSignedUrlResponse) {
          res.metadata = asset?.metadata || null;
        }

        return res;
      })
    );

    return {
      asset: assets?.[0],
      assets,
    };
  }
}
