import { it, expect, describe, beforeEach, afterEach } from 'vitest';
import Keyv from 'keyv';
import KeyvPostgres from '@keyv/postgres';
import { nanoid } from 'nanoid';
import { KeyvAssetStore, NextUpload, NextUploadConfig } from '../src';

const keyv = new Keyv({
  namespace: NextUpload.namespaceFromEnv(),
  store: new KeyvPostgres({
    uri: `${process.env.PG_CONNECTION_STRING}/${process.env.PG_DB}`,
  }),
});

const keyvAssetStore = new KeyvAssetStore(keyv);

const runTests = (name: string, assetStore?: KeyvAssetStore) => {
  const nextUploadConfig: NextUploadConfig = {
    client: {
      secretKey: process.env.MINIO_SECRET_KEY,
      accessKey: process.env.MINIO_ACCESS_KEY,
      endPoint: process.env.MINIO_ENDPOINT,
      port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : undefined,
      useSSL: process.env.MINIO_SSL === `true`,
      region: process.env.MINIO_REGION,
    },
    api: `/upload`,
    maxSize: '10mb',
  };

  const fileType = 'image/png';

  beforeEach(() => {});

  afterEach(async () => {
    await keyv.clear();
  });

  describe(`NextUpload - ${name}`, () => {
    it(`initializes`, async () => {
      const nup = new NextUpload(nextUploadConfig, assetStore);

      await nup.init();

      const client = nup.getClient();

      expect(await client.bucketExists(nup.getBucket())).toBe(true);
    });

    describe(`generatePresignedPostPolicy`, () => {
      it(`generatePresignedPostPolicy`, async () => {
        const nup = new NextUpload(nextUploadConfig, assetStore);

        await nup.init();

        const signedUrl = await nup.generatePresignedPostPolicy({
          fileType,
        });

        expect(signedUrl).toMatchObject({
          id: expect.any(String),
          url: expect.any(String),
          data: expect.any(Object),
        });

        if (assetStore) {
          expect(assetStore.find(signedUrl.id)).resolves.toMatchObject({
            id: signedUrl.id,
            name: '',
            path: `default/${signedUrl.id}`,
            updatedAt: expect.any(String),
            createdAt: expect.any(String),
            uploadType: 'default',
            bucket: 'localhost-test',
            verified: null,
            fileType,
          });
        }
      });

      it(`with id`, async () => {
        const nup = new NextUpload(nextUploadConfig, assetStore);

        await nup.init();

        const id = nanoid();

        const signedUrl = await nup.generatePresignedPostPolicy({
          id,
          fileType,
        });

        expect(signedUrl).toMatchObject({
          id,
        });

        if (assetStore) {
          expect(assetStore.find(signedUrl.id)).resolves.toMatchObject({
            id,
          });
        }
      });

      it(`with metadata`, async () => {
        const nup = new NextUpload(nextUploadConfig, assetStore);

        await nup.init();

        const metadata = {
          foo: 'bar',
        };

        if (assetStore) {
          const signedUrl = await nup.generatePresignedPostPolicy({
            metadata,
            fileType,
          });

          expect(assetStore.find(signedUrl.id)).resolves.toMatchObject({
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
        const nup = new NextUpload(nextUploadConfig, assetStore);

        await nup.init();

        const id = nanoid();

        const signedUrl = await nup.generatePresignedPostPolicy({
          id,
          fileType,
        });

        expect(signedUrl).toMatchObject({
          id,
        });

        const buffer = `test`;

        await nup
          .getClient()
          .putObject(nup.getBucket(), signedUrl.data.key, buffer);

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
          assetStore
        );

        await nup.init();

        const signedUrl = await nup.generatePresignedPostPolicy({
          uploadType,
          fileType,
        });

        if (assetStore) {
          const asset = await assetStore.find(signedUrl.id);

          expect(asset).toMatchObject({
            path: `${uploadType}/${signedUrl.id}`,
          });
        }
      });

      if (assetStore) {
        it(`generatePresignedPostPolicy & verify assets`, async () => {
          const nup = new NextUpload(
            {
              ...nextUploadConfig,
              verifyAssets: true,
            },
            assetStore
          );

          await nup.init();

          const signedUrl = await nup.generatePresignedPostPolicy({
            fileType,
          });

          expect(signedUrl).toMatchObject({
            id: expect.any(String),
            url: expect.any(String),
            data: expect.any(Object),
          });

          expect(assetStore.find(signedUrl.id)).resolves.toMatchObject({
            id: signedUrl.id,
            name: '',
            path: `default/${signedUrl.id}`,
            uploadType: 'default',
            updatedAt: expect.any(String),
            bucket: 'localhost-test',
            verified: false,
            fileType,
          });

          await nup.verifyAsset({ id: signedUrl.id });

          expect(assetStore.find(signedUrl.id)).resolves.toMatchObject({
            id: signedUrl.id,
            verified: true,
          });
        });

        it(`pruneAssets`, async () => {
          const nup = new NextUpload(
            {
              ...nextUploadConfig,
              verifyAssets: true,
            },
            assetStore
          );

          await nup.init();

          await nup.generatePresignedPostPolicy({
            fileType,
          });

          const assets = await assetStore.all();

          expect(assets.length).toBe(1);

          await nup.pruneAssets();
        });
      }

      it(`bucket from env`, async () => {
        expect(NextUpload.bucketFromEnv()).toEqual(`localhost-test`);
        expect(NextUpload.bucketFromEnv(`next-upload`)).toEqual(
          `localhost-next-upload-test`
        );
      });

      // describe(`getPresignedUrl`, () => {
      //   it(`getPresignedUrl`, async () => {
      //     const nup = new NextUpload(nextUploadConfig, assetStore);

      //     // @ts-ignore
      //     nup.client.statObject = jest.fn().mockResolvedValueOnce();
      //   });
      // });
    });
  });
};

runTests('No Store', undefined);
runTests('KeyvAssetStore', keyvAssetStore);
