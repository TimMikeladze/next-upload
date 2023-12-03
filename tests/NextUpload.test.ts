import { resolve } from 'path';
import { it, expect, describe, beforeEach, afterEach, vi } from 'vitest';
import Keyv from 'keyv';
import KeyvPostgres from '@keyv/postgres';
import { nanoid } from 'nanoid';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { HeadBucketCommand } from '@aws-sdk/client-s3';
import {
  NextUpload,
  NextUploadStore,
  NextUploadConfig,
  NextUploadAction,
} from '../src';
import { NextUploadDrizzlePgStore } from '../src/store/drizzle/postgres-js/store';
import { getDb } from './db/getDb';
import { NextUploadKeyvStore } from '../src/store/keyv';
import { nextUploadAssetsTable } from '../src/store/drizzle/pg-core/schema';

const runTests = async (
  name: string,
  args: {
    afterEach?: () => Promise<void>;
    beforeEach?: () => Promise<void>;
    store?: () => Promise<NextUploadStore>;
  }
) => {
  const nextUploadConfig: NextUploadConfig = {
    client: {
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        secretAccessKey: process.env.S3_SECRET_KEY,
        accessKeyId: process.env.S3_ACCESS_KEY,
      },
      forcePathStyle: true,
    },
    maxSize: '10mb',
  };

  const fileType = 'image/png';

  beforeEach(async () => {
    await args.beforeEach?.();
  });

  afterEach(async () => {
    await args.afterEach?.();
  });

  describe(`NextUpload - ${name}`, () => {
    it(`initializes`, async () => {
      const nup = new NextUpload(nextUploadConfig, args.store);

      await nup.init();

      const client = nup.getClient();

      const headBucketCommand = new HeadBucketCommand({
        Bucket: nup.getBucket(),
      });

      expect(await client.send(headBucketCommand)).toBeDefined();
    });

    describe(`deleteAsset`, () => {
      it(`works`, async () => {
        const nup = new NextUpload(
          {
            ...nextUploadConfig,
            includeObjectPathInPostPolicyResponse: true,
          },
          args.store
        );

        await nup.init();

        const { postPolicy: signedPostPolicy } =
          await nup.generatePresignedPostPolicy({
            fileType,
          });

        await nup.getClient().putObject({
          Bucket: nup.getBucket(),
          Key: signedPostPolicy.data.key,
          Body: `test`,
        });

        const { asset: presignedUrl } = await nup.getAsset({
          id: signedPostPolicy.id,
          path: signedPostPolicy.path,
        });

        expect(presignedUrl.id).toEqual(signedPostPolicy.id);

        if (args.store) {
          expect(
            nup.getStore()?.find(signedPostPolicy.id)
          ).resolves.toMatchObject({
            id: signedPostPolicy.id,
          });
        }

        await nup.deleteAsset({
          id: signedPostPolicy.id,
          path: signedPostPolicy.path,
        });

        if (args.store) {
          expect(
            nup.getStore()?.find(signedPostPolicy.id)
          ).resolves.toBeFalsy();
        }
      });
    });

    describe(`generatePresignedPostPolicy`, () => {
      it(`generatePresignedPostPolicy`, async () => {
        const nup = new NextUpload(nextUploadConfig, args.store);

        await nup.init();

        const { postPolicy } = await nup.generatePresignedPostPolicy({
          fileType,
        });

        expect(postPolicy.id).toEqual(expect.any(String));
        expect(postPolicy.url).toEqual(expect.any(String));
        expect(postPolicy.data).toEqual(expect.any(Object));

        const assetStore = nup.getStore();

        if (assetStore) {
          expect(assetStore.find(postPolicy.id)).resolves.toMatchObject({
            id: postPolicy.id,
            name: '',
            path: `default/${postPolicy.id}`,
            uploadType: 'default',
            bucket: 'localhost-test',
            verified: null,
            fileType,
          });
        }
      });

      it(`with id`, async () => {
        const nup = new NextUpload(nextUploadConfig, args.store);

        await nup.init();

        const id = nanoid();

        const { postPolicy } = await nup.generatePresignedPostPolicy({
          id,
          fileType,
        });

        expect(postPolicy.id).toEqual(id);

        const assetStore = nup.getStore();

        if (assetStore) {
          expect(assetStore.find(postPolicy.id)).resolves.toMatchObject({
            id,
          });
        }
      });

      it(`with metadata`, async () => {
        const nup = new NextUpload(nextUploadConfig, args.store);

        await nup.init();

        const metadata = {
          foo: 'bar',
        };

        const assetStore = nup.getStore();

        if (assetStore) {
          const { postPolicy } = await nup.generatePresignedPostPolicy({
            metadata,
            fileType,
          });

          expect(assetStore.find(postPolicy.id)).resolves.toMatchObject({
            metadata,
          });
        } else {
          await expect(
            nup.generatePresignedPostPolicy({
              metadata,
              fileType,
            })
          ).rejects.toThrowError(
            `saving metadata requires NextUpload to be instantiated with a store`
          );
        }
      });

      it(`prevent duplicate ids`, async () => {
        const nup = new NextUpload(nextUploadConfig, args.store);

        await nup.init();

        const id = nanoid();

        const { postPolicy } = await nup.generatePresignedPostPolicy({
          id,
          fileType,
        });

        expect(postPolicy.id).toEqual(id);

        await nup.getClient().putObject({
          Bucket: nup.getBucket(),
          Key: postPolicy.data.key,
          Body: `test`,
        });

        expect(
          nup.generatePresignedPostPolicy({
            id,
            fileType,
          })
        ).rejects.toThrowError(`${id} already exists`);
      });

      it(`with type`, async () => {
        const uploadType = 'image';
        const nup = new NextUpload(
          {
            ...nextUploadConfig,
            uploadTypes: {
              [uploadType]: {},
            },
          },
          args.store
        );

        await nup.init();

        const { postPolicy } = await nup.generatePresignedPostPolicy({
          uploadType,
          fileType,
        });

        const assetStore = nup.getStore();

        if (assetStore) {
          const asset = await assetStore.find(postPolicy.id);

          expect(asset).toMatchObject({
            path: `${uploadType}/${postPolicy.id}`,
          });
        }
      });

      if (args.store) {
        it(`generatePresignedPostPolicy & verify assets`, async () => {
          const nup = new NextUpload(
            {
              ...nextUploadConfig,
              verifyAssets: true,
            },
            args.store
          );

          await nup.init();

          const assetStore = nup.getStore();

          if (!assetStore) {
            throw new Error(`assetStore is undefined`);
          }

          const { postPolicy } = await nup.generatePresignedPostPolicy({
            fileType,
          });

          expect(postPolicy).toMatchObject({
            id: expect.any(String),
            url: expect.any(String),
            data: expect.any(Object),
          });

          expect(assetStore.find(postPolicy.id)).resolves.toMatchObject({
            id: postPolicy.id,
            name: '',
            path: `default/${postPolicy.id}`,
            uploadType: 'default',
            bucket: 'localhost-test',
            verified: false,
            fileType,
          });

          await nup.verifyAsset({ id: postPolicy.id });

          expect(assetStore.find(postPolicy.id)).resolves.toMatchObject({
            id: postPolicy.id,
            verified: true,
          });
        });

        it(`pruneAssets`, async () => {
          const nup = new NextUpload(
            {
              ...nextUploadConfig,
              verifyAssets: true,
            },
            args.store
          );

          await nup.init();

          const { postPolicy } = await nup.generatePresignedPostPolicy({
            fileType,
          });

          await nup.getClient().putObject({
            Bucket: nup.getBucket(),
            Key: postPolicy.data.key,
            Body: `test`,
          });

          const assetStore = nup.getStore();

          if (!assetStore) {
            throw new Error(`assetStore is undefined`);
          }

          expect(
            (await assetStore.all()).find((a) => a.id === postPolicy.id)
          ).toBeTruthy();

          await nup.pruneAssets();

          expect(
            (await assetStore.all()).find((a) => a.id === postPolicy.id)
          ).toBeFalsy();
        });
      }
    });

    it(`bucket from env`, async () => {
      expect(NextUpload.bucketFromEnv()).toEqual(`localhost-test`);
      expect(NextUpload.bucketFromEnv(`next-upload`)).toEqual(
        `localhost-next-upload-test`
      );
    });

    describe(`rawHandler`, () => {
      it(`throws error if missing body`, async () => {
        const nup = new NextUpload(nextUploadConfig, args.store);

        const send = vi.fn();

        await nup.rawHandler({
          send,
          request: {},
        });

        expect(send.mock.calls[0]).toMatchObject([
          {
            error: 'No body',
          },
          {
            status: 400,
          },
        ]);
      });
      it(`throws error if missing action`, async () => {
        const nup = new NextUpload(nextUploadConfig, args.store);

        const send = vi.fn();

        await nup.rawHandler({
          send,
          request: {
            body: {
              action: '',
              input: {},
            },
          },
        });

        expect(send.mock.calls[0]).toMatchObject([
          {
            error: 'No action',
          },
          {
            status: 400,
          },
        ]);
      });
      it(`throws error if action not enabled`, async () => {
        const nup = new NextUpload(nextUploadConfig, args.store);

        const send = vi.fn();

        await nup.rawHandler({
          send,
          request: {
            body: {
              input: {},
              action: NextUploadAction.deleteAsset,
            },
          },
        });

        expect(send.mock.calls[0]).toMatchObject([
          {
            error: 'Action "deleteAsset" not enabled',
          },
          {
            status: 400,
          },
        ]);
      });
    });
  });
};

const keyv = new Keyv({
  namespace: NextUpload.namespaceFromEnv(),
  store: new KeyvPostgres({
    uri: `${process.env.PG_CONNECTION_STRING}/${process.env.PG_DB}`,
  }),
});

const keyvStore = new NextUploadKeyvStore(keyv);

runTests('No Store', {});
runTests('KeyvStore', {
  store: () => Promise.resolve(keyvStore),
  beforeEach: async () => {
    await keyv.clear();
  },
  afterEach: async () => {
    await keyv.clear();
  },
});
runTests(`NextUploadDrizzlePgStore`, {
  store: async () => new NextUploadDrizzlePgStore(await getDb()),
  beforeEach: async () => {
    await migrate(await getDb(), {
      migrationsFolder: resolve(`tests/db/migrations`),
    });
    (await getDb()).delete(nextUploadAssetsTable);
  },
  afterEach: async () => {
    (await getDb()).delete(nextUploadAssetsTable);
  },
});
