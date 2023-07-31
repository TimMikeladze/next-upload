# 🗃️ next-upload

A turn-key solution for integrating Next.js with signed & secure file-uploads to an S3 compliant storage service such as R2, AWS, or Minio.

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
export const nextUploadConfig: NextUploadConfig = {
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
import { nextUploadConfig } from '@/app/upload/config';

const FileUpload = () => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    await upload(
      acceptedFiles.map((file) => ({
        file,
      })),
      nextUploadConfig
    );
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

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
