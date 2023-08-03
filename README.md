# 🗃️ next-upload

A turn-key solution for integrating Next.js with signed & secure file-uploads to an S3 compliant storage service such as R2, AWS, or Minio.

Check out this [example](https://github.com/TimMikeladze/next-upload/tree/master/examples/next-upload-example) of Next.js codebase showcasing an advanced implementation of `next-upload`.

## Install

```console
npm install next-upload

yarn add next-upload

pnpm add next-upload
```

## Configuration

First let's create a `NextUploadConfig` that defines how to connect to a storage service, different types of file uploads, size limits and more. The example below uses AWS S3 as the storage service but you can use any S3 compatible service.

**src/app/upload/config.ts**

```tsx
export const config: NextUploadConfig = {
  maxSize: '10mb',
  client: {
    endPoint: `s3.us-west-1.amazonaws.com`,
    region: `us-west-1`,
    secretKey: `xxxxxx`,
    accessKey: `xxxxxx`,
  },
};
```

Now to integrate with Next.js we need to create an HTTP route that will handle `next-upload` related requests such as generating signed URLs. In the example below we are using a `POST` route at `/upload` with the Next.js App router. If you are using the Pages router or a different framework you can leverage the `NextUpload.pagesApiHandler` or `NextUpload.rawHandler` functions directly to achieve the same result.

**src/app/upload/route.ts**

```tsx
import { NextUpload } from 'next-upload';
import { config } from './config';
import { NextRequest } from 'next/server';

const nup = new NextUpload(config);

export const POST = (request: NextRequest) => nup.handler(request);
```

At this point you can import helper functions from `next-upload/client` to send files to your storage service in one line of code.

How your application handles file-uploads in the browser is up to you. The example below uses `react-dropzone` to send files to storage via the `upload` function.

**src/components/FileUpload.tsx**

```tsx
'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { upload } from 'next-upload/client';
import { config } from '@/app/upload/config';

const FileUpload = () => {
  const onDropAccepted = useCallback(async (acceptedFiles: File[]) => {
    await upload(
      acceptedFiles.map((file) => ({
        file,
      })),
      config
    );
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted,
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>Drag 'n' drop some files here, or click to select files</p>
      )}
    </div>
  );
};

export default FileUpload;
```

## Asset Store

It's often useful to save an additional reference to the uploaded file in your database. This can be used for things like displaying a list of files that have been uploaded or associating a file with a specific user within your application without having to query the storage service directly. `next-upload` provides an interface that can be implemented with any database of your choice. Out of the box `AssetStore` works with any [keyv](https://github.com/jaredwray/) enabled store. This includes popular databases such as Postgres, MySQL and Mongo.

To use `AssetStore` you need to create a new instance specifying your database storage options and then pass it to the `NextUpload` constructor.

**src/app/upload/route.ts**

```tsx
import { AssetStore, NextUpload } from 'next-upload';
import { config } from './config';
import { NextRequest } from 'next/server';
import Keyv from 'keyv';
import KeyvPostgres from '@keyv/postgres';

const nup = new NextUpload(
  config,
  new AssetStore(
    new Keyv({
      namespace: NextUpload.namespaceFromEnv(),
      store: new KeyvPostgres({
        uri: process.env.PG_CONNECTION_STRING + '/' + process.env.PG_DB,
      }),
    })
  )
);

export const POST = (request: NextRequest) => nup.handler(request);
```

### Retrieving Assets

Once you have uploaded a file you can retrieve it from the database using the `AssetStore` instance.

```tsx
const assetStore = new AssetStore(
  new Keyv({
    namespace: NextUpload.namespaceFromEnv(),
    store: new KeyvPostgres({
      uri: process.env.PG_CONNECTION_STRING + '/' + process.env.PG_DB,
    }),
  })
);

await assetStore.find('id of the asset');
```

## Metadata

Using an `AssetStore` enables you to save additional metadata about the file as part of the upload process. This can be useful for storing things like the original file name, user id of the uploader, or any other information you want to associate with the file.

To get started simply pass a `metadata` object to the `upload` function.

```tsx
import { upload } from 'next-upload/client';

await upload(
  acceptedFiles.map((file) => ({
    file,
    metadata: {
      userId: '123',
    },
  })),
  config
);
```

## Verifying uploads & Pruning assets

Often times you will want to mark an upload as verified once it has been processed by your application.

To enable verification, set the `verifyAssets` config to `true` and instantiate `NextUpload` with an `AssetStore` instance.

Now any file that is uploaded will have a `verified` property set to `false` by default. Once you have processed the file you can mark it as verified by calling `NextUpload.verifyAsset(id)`.

Additionally, you can call a `NextUpload.pruneAssets` as part of a cron job to delete any assets that have not been verified within a specified time period.

<!-- TSDOC_START -->

## :toolbox: Functions

- [getSignedUrl](#gear-getsignedurl)
- [uploadToSignedUrl](#gear-uploadtosignedurl)
- [upload](#gear-upload)

### :gear: getSignedUrl

| Function       | Type                                                                                    |
| -------------- | --------------------------------------------------------------------------------------- |
| `getSignedUrl` | `(options: GetSignedUrlOptions, config: NextUploadConfig) => Promise<SignedPostPolicy>` |

### :gear: uploadToSignedUrl

| Function            | Type                                                       |
| ------------------- | ---------------------------------------------------------- |
| `uploadToSignedUrl` | `(options: UploadToSignedUrlOptions) => Promise<Response>` |

### :gear: upload

| Function | Type                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------ |
| `upload` | `(options: UploadOptions or UploadOptions[], config: NextUploadConfig) => Promise<SignedPostPolicy[]>` |

## :factory: AssetStore

### Methods

- [iterator](#gear-iterator)

#### :gear: iterator

| Method     | Type        |
| ---------- | ----------- |
| `iterator` | `() => any` |

## :factory: NextUpload

### Methods

- [namespaceFromEnv](#gear-namespacefromenv)
- [bucketFromEnv](#gear-bucketfromenv)
- [getIdFromPath](#gear-getidfrompath)
- [getUploadTypeFromPath](#gear-getuploadtypefrompath)
- [getBucket](#gear-getbucket)
- [getClient](#gear-getclient)
- [getConfig](#gear-getconfig)
- [getStore](#gear-getstore)
- [init](#gear-init)
- [generatePresignedPostPolicy](#gear-generatepresignedpostpolicy)
- [pruneAssets](#gear-pruneassets)
- [verifyAsset](#gear-verifyasset)
- [getPresignedUrl](#gear-getpresignedurl)
- [handler](#gear-handler)
- [pagesApiHandler](#gear-pagesapihandler)
- [rawHandler](#gear-rawhandler)

#### :gear: namespaceFromEnv

| Method             | Type                           |
| ------------------ | ------------------------------ |
| `namespaceFromEnv` | `(project?: string) => string` |

#### :gear: bucketFromEnv

| Method          | Type                           |
| --------------- | ------------------------------ |
| `bucketFromEnv` | `(project?: string) => string` |

#### :gear: getIdFromPath

| Method          | Type                       |
| --------------- | -------------------------- |
| `getIdFromPath` | `(path: string) => string` |

#### :gear: getUploadTypeFromPath

| Method                  | Type                       |
| ----------------------- | -------------------------- |
| `getUploadTypeFromPath` | `(path: string) => string` |

#### :gear: getBucket

| Method      | Type           |
| ----------- | -------------- |
| `getBucket` | `() => string` |

#### :gear: getClient

| Method      | Type           |
| ----------- | -------------- |
| `getClient` | `() => Client` |

#### :gear: getConfig

| Method      | Type                     |
| ----------- | ------------------------ |
| `getConfig` | `() => NextUploadConfig` |

#### :gear: getStore

| Method     | Type                         |
| ---------- | ---------------------------- |
| `getStore` | `() => NextUploadAssetStore` |

#### :gear: init

| Method | Type                  |
| ------ | --------------------- |
| `init` | `() => Promise<void>` |

#### :gear: generatePresignedPostPolicy

| Method                        | Type                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| `generatePresignedPostPolicy` | `(args: GeneratePresignedPostPolicyArgs, request?: NextUploadRequest) => Promise<SignedPostPolicy>` |

#### :gear: pruneAssets

| Method        | Type                  |
| ------------- | --------------------- |
| `pruneAssets` | `() => Promise<void>` |

#### :gear: verifyAsset

| Method        | Type                                                               |
| ------------- | ------------------------------------------------------------------ |
| `verifyAsset` | `(args: VerifyAssetArgs or VerifyAssetArgs[]) => Promise<Asset[]>` |

#### :gear: getPresignedUrl

| Method            | Type                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `getPresignedUrl` | `(args: GetPresignedUrlArgs or GetPresignedUrlArgs[], request?: NextUploadRequest) => Promise<GetPresignedUrl[]>` |

#### :gear: handler

| Method    | Type                                                                      |
| --------- | ------------------------------------------------------------------------- | ------------------------------- | ------------------- |
| `handler` | `(request: NextRequest) => Promise<void or NextResponse<SignedPostPolicy> | NextResponse<GetPresignedUrl[]> | NextResponse<...>>` |

#### :gear: pagesApiHandler

| Method            | Type                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------- |
| `pagesApiHandler` | `(request: NextApiRequest, response: NextApiResponse) => Promise<void or NextResponse<SignedPostPolicy> | NextResponse<GetPresignedUrl[]> | NextResponse<...>>` |

#### :gear: rawHandler

| Method       | Type                                                                          |
| ------------ | ----------------------------------------------------------------------------- | ------------------------------- | ------------------- |
| `rawHandler` | `(handlerArgs: HandlerArgs) => Promise<void or NextResponse<SignedPostPolicy> | NextResponse<GetPresignedUrl[]> | NextResponse<...>>` |

<!-- TSDOC_END -->
