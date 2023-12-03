# 🗃️ next-upload

A turn-key solution for integrating Next.js with signed & secure file-uploads to an S3 compliant storage service such as R2, AWS, or Minio. Generates signed URLs for uploading files directly to your storage service and optionally integrates with your database to store additional metadata about your files.

Check out this [example](https://github.com/TimMikeladze/next-upload/tree/master/examples/next-upload-example) of a Next.js codebase showcasing an advanced implementation of `next-upload` with different storage services and databases.

> 🚧 Under active development. Expect breaking changes until v1.0.0.

## 📡 Install

```console
npm install next-upload

yarn add next-upload

pnpm add next-upload
```

> 👋 Hello there! Follow me [@linesofcode](https://twitter.com/linesofcode) or visit [linesofcode.dev](https://linesofcode.dev) for more cool projects like this one.

## 🚀 Getting Started

First let's create a `NextUploadConfig` that defines how to connect to a storage service, different types of file uploads, size limits and more. The example below uses AWS S3 as the storage service but you can use any S3 compatible service.

**src/app/upload/config.ts**

```tsx
import { type NextUploadConfig } from 'next-upload/client';
import { NextUpload } from 'next-upload';

export const config: NextUploadConfig = {
  maxSize: '1mb',
  bucket: NextUpload.bucketFromEnv('my-project-name'),
  client: {
    region: 'us-west-1',
    endpoint: 'https://s3.us-west-1.amazonaws.com',
    credentials: {
      secretAccessKey: process.env.S3_SECRET_KEY,
      accessKeyId: process.env.S3_ACCESS_KEY,
    },
  },
};
```

Now to integrate with Next.js we need to create an HTTP route that will handle `next-upload` related requests such as generating signed URLs. In the example below we are using a `POST` route at `/upload` with the Next.js App router. If you are using the Pages router or a different framework you can leverage the `NextUpload.pagesApiHandler` or `NextUpload.rawHandler` functions directly to achieve the same result.

> 🔒 This a good place to add authentication to your upload route to restrict who has access to upload files.

**src/app/upload/route.ts**

```tsx
import { NextUpload } from 'next-upload';
import { config } from './config';
import { NextRequest } from 'next/server';

const nup = new NextUpload(config);

export const POST = (request: NextRequest) => nup.handler(request);

export const dynamic = 'force-dynamic';

// Optionally, if your application supports it you can run next-upload in the Edge runtime.
export const runtime = 'edge'; 
```

At this point you can import helper functions from `next-upload/client` to send files to your storage service in one line of code.

How your application handles file-uploads in the browser is up to you. The example below uses `react-dropzone` to send files to storage via the `upload` function.

**src/components/FileUpload.tsx**

```tsx
'use client';

import { useDropzone } from 'react-dropzone';
import { useNextUpload } from 'next-upload/react';

const FileUpload = () => {
  const nup = useNextUpload();

  const onDropAccepted = (acceptedFiles: File[]) =>
    nup.upload(
      acceptedFiles.map((file) => ({
        file,
      }))
    );

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
      {nup.isUploading && <p>Uploading...</p>}
    </div>
  );
};

export default FileUpload;
```

## 🧳 Storage

It's often useful to save an additional reference to the uploaded file in your database. This can be used for things like displaying a list of files that have been uploaded or associating a file with a specific user within your application without having to query the storage service directly. `next-upload` provides an interface that can be implemented with any database of your choice.  

> 🙋 Is your database missing? Implementing the [`Store`](https://github.com/TimMikeladze/next-upload/blob/master/src/types.ts#L55) is very straight-forward. Feel free to open a PR with your implementation or [open an issue](https://github.com/TimMikeladze/next-upload/issues/new) to request a new asset store implementation.

Out of the box `next-upload` provides the following asset store implementations:

### 🗝️ KeyvStore - all popular databases supported

Works with any [keyv](https://github.com/jaredwray/) enabled store. This includes popular databases such as Postgres, MySQL and Mongo. This is a simple option for getting started with an asset store with minimal overhead. **Warning:** Using keyv is inherently slower than using a more specific database client. If you are expecting a high volume of reads/writes to your asset store you should consider using a different implementation.

**src/app/upload/nup.ts**
```tsx
import { nextUploadConfig } from '@/app/upload/config';
import KeyvPostgres from '@keyv/postgres';
import Keyv from 'keyv';
import { NextUpload } from 'next-upload';
import { NextUploadKeyvStore } from 'next-upload/store/keyv';

export const nup = new NextUpload(
  nextUploadConfig,
  new NextUploadKeyvStore(
    new Keyv({
      namespace: NextUpload.namespaceFromEnv('my-project-name'),
      store: new KeyvPostgres({
        uri: `${process.env.PG_CONNECTION_STRING}/${process.env.PG_DB}`,
      }),
    })
  )
);
```

### ☔️ Drizzle

Works with a [Drizzle](https://github.com/drizzle-team/drizzle-orm) enabled database. This is a great option if you are already using Drizzle in your application and want tighter integration with your database schema. It also provides a more performant option for high volume reads/writes to your asset store. 

#### 🐘 NextUploadDrizzlePgStore

The following Postgres clients are directly supported. Other Postgres clients most likely will work but may raise TypeScript errors during initialization of the `NextUploadDrizzlePgStore` instance.

- [Postgres.JS](https://orm.drizzle.team/docs/quick-postgresql/postgresjs)
- [node-postgres](https://orm.drizzle.team/docs/quick-postgresql/node-postgres)
- [Neon](https://orm.drizzle.team/docs/quick-postgresql/neon)

**src/db/schema.ts**
```tsx
export { nextUploadAssetsTable } from 'next-upload/store/drizzle/postgres-js';
```

**src/app/upload/nup.ts**
```tsx
import { nextUploadConfig } from '@/app/nextUploadConfig';
import { getDbPostgresJs } from '@/drizzle/getDbPostgresJs';
import { NextUpload } from 'next-upload';
import { NextUploadDrizzlePgStore } from 'next-upload/store/drizzle/postgres-js';

export const nup = new NextUpload(
  nextUploadConfig,
  new NextUploadDrizzlePgStore(getDbPostgresJs())
);

```

### 🔗 Getting an Asset Url

Once you have uploaded a file you can retrieve the url, id and metadata of the asset using the `NextUpload.getAsset` function.

```tsx
const { asset } = await nup.getAsset({
  id: 'id of the asset',
  // or provide a path
  path: 'path of the asset',
})

```

### 🗑️ Deleting Assets

You can delete an asset with `NextUpload.deleteAsset`. This will delete the asset from your storage service and the asset store if you have one configured.

```tsx
await nup.deleteAsset({
  id: 'id of the asset',
  // or provide a path
  path: 'path of the asset',
})
```

### 🔎 Retrieving Assets

Once you have uploaded a file you can retrieve it from the database using the `Store` instance.

```tsx
const store = nup.getStore();

await store.find('id of the asset');
```

## 📝 Metadata

Using an `Store` enables you to save additional metadata about the file as part of the upload process. This can be useful for storing things like the original file name, user id of the uploader, or any other information you want to associate with the file.

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

## ✅ Verifying uploads 

In certain scenarios you may need to mark an upload as verified once it has been processed by your application.

To enable verification, set the `verifyAssets` config to `true` and instantiate `NextUpload` with an `Store` instance.

Now any file that is uploaded will have a `verified` property set to `false` by default. Once you have processed the file you can mark it as verified by calling `NextUpload.verifyAsset(id)`.

## ✂️ Pruning assets

At any time you can call a `NextUpload.pruneAssets` to delete any assets that have expired due to lack of verification or to remove dangling files or records from the system.

Consider setting up a cron job to run this function on a regular basis.

<!-- TSDOC_START -->

## :wrench: Constants

- [defaultEnabledHandlerActions](#gear-defaultenabledhandleractions)

### :gear: defaultEnabledHandlerActions

| Constant | Type |
| ---------- | ---------- |
| `defaultEnabledHandlerActions` | `NextUploadAction[]` |


## :factory: NextUpload

### Methods

- [🗃️ next-upload](#️-next-upload)
  - [📡 Install](#-install)
  - [🚀 Getting Started](#-getting-started)
  - [🧳 Storage](#-storage)
    - [🗝️ KeyvStore - all popular databases supported](#️-keyvstore---all-popular-databases-supported)
    - [☔️ Drizzle](#️-drizzle)
      - [🐘 NextUploadDrizzlePgStore](#-nextuploaddrizzlepgstore)
    - [🔗 Getting an Asset Url](#-getting-an-asset-url)
    - [🗑️ Deleting Assets](#️-deleting-assets)
    - [🔎 Retrieving Assets](#-retrieving-assets)
  - [📝 Metadata](#-metadata)
  - [✅ Verifying uploads](#-verifying-uploads)
  - [✂️ Pruning assets](#️-pruning-assets)
  - [:wrench: Constants](#wrench-constants)
    - [:gear: defaultEnabledHandlerActions](#gear-defaultenabledhandleractions)
  - [:factory: NextUpload](#factory-nextupload)
    - [Methods](#methods)
      - [:gear: generatePresignedPostPolicy](#gear-generatepresignedpostpolicy)
      - [:gear: namespaceFromEnv](#gear-namespacefromenv)
      - [:gear: bucketFromEnv](#gear-bucketfromenv)
      - [:gear: getIdFromPath](#gear-getidfrompath)
      - [:gear: getUploadTypeFromPath](#gear-getuploadtypefrompath)
      - [:gear: calculateExpires](#gear-calculateexpires)
      - [:gear: isExpired](#gear-isexpired)
      - [:gear: getBucket](#gear-getbucket)
      - [:gear: getClient](#gear-getclient)
      - [:gear: init](#gear-init)
      - [:gear: bucketExists](#gear-bucketexists)
      - [:gear: generatePresignedPostPolicy](#gear-generatepresignedpostpolicy-1)
      - [:gear: pruneAssets](#gear-pruneassets)
      - [:gear: verifyAsset](#gear-verifyasset)
      - [:gear: deleteAsset](#gear-deleteasset)
      - [:gear: getAsset](#gear-getasset)

#### :gear: generatePresignedPostPolicy

| Method | Type |
| ---------- | ---------- |
| `generatePresignedPostPolicy` | `(args: any, request: NextToolRequest) => Promise<{ postPolicy: SignedPostPolicy; }>` |

#### :gear: namespaceFromEnv

| Method | Type |
| ---------- | ---------- |
| `namespaceFromEnv` | `(project?: string) => string` |

#### :gear: bucketFromEnv

| Method | Type |
| ---------- | ---------- |
| `bucketFromEnv` | `(project?: string) => string` |

#### :gear: getIdFromPath

| Method | Type |
| ---------- | ---------- |
| `getIdFromPath` | `(path: string) => string` |

#### :gear: getUploadTypeFromPath

| Method | Type |
| ---------- | ---------- |
| `getUploadTypeFromPath` | `(path: string) => string` |

#### :gear: calculateExpires

| Method | Type |
| ---------- | ---------- |
| `calculateExpires` | `(ttl: number) => number` |

#### :gear: isExpired

| Method | Type |
| ---------- | ---------- |
| `isExpired` | `(timestamp: number) => boolean` |

#### :gear: getBucket

| Method | Type |
| ---------- | ---------- |
| `getBucket` | `() => string` |

#### :gear: getClient

| Method | Type |
| ---------- | ---------- |
| `getClient` | `() => S3` |

#### :gear: init

| Method | Type |
| ---------- | ---------- |
| `init` | `() => Promise<void>` |

#### :gear: bucketExists

| Method | Type |
| ---------- | ---------- |
| `bucketExists` | `() => Promise<boolean>` |

#### :gear: generatePresignedPostPolicy

| Method | Type |
| ---------- | ---------- |
| `generatePresignedPostPolicy` | `(args: GeneratePresignedPostPolicyArgs, request?: NextUploadRequest) => Promise<{ postPolicy: SignedPostPolicy; }>` |

#### :gear: pruneAssets

| Method | Type |
| ---------- | ---------- |
| `pruneAssets` | `() => Promise<boolean>` |

#### :gear: verifyAsset

| Method | Type |
| ---------- | ---------- |
| `verifyAsset` | `(args: VerifyAssetArgs or VerifyAssetArgs[]) => Promise<{ asset: Asset; assets: Asset[]; }>` |

#### :gear: deleteAsset

| Method | Type |
| ---------- | ---------- |
| `deleteAsset` | `(args: DeleteArgs or DeleteArgs[]) => Promise<boolean>` |

#### :gear: getAsset

| Method | Type |
| ---------- | ---------- |
| `getAsset` | `(args: GetAssetArgs or GetAssetArgs[], request?: NextUploadRequest) => Promise<{ asset: GetAsset; assets: GetAsset[]; }>` |


<!-- TSDOC_END -->
