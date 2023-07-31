# 🗃️ next-upload

✨ A turn-key solution for integrating Next.js with signed & secure file-uploads to an S3 compliant storage service such as R2, AWS, or Minio.

## Install

```console
npm install next-upload

yarn add next-upload

pnpm install next-upload
```

## Configuration

**src/app/upload/config.ts**

```tsx
export enum NextUploadType {
  document = `document`,
}

export const nextUploadConfig: NextUploadConfig = {
  client: {
    endPoint: `s3.us-west-1.amazonaws.com`,
    region: `us-west-1`,
    secretKey: `xxxxxx`,
    accessKey: `xxxxxx`,
  },
  api: `/upload`,
  uploadTypes: {
    [NextUploadType.document]: {
      maxSize: '5mb',
    },
  },
};
```

**src/app/upload/route.ts**

```tsx
import { NextUpload } from 'next-upload';
import { NextRequest } from 'next/server';
import { nextUploadConfig } from './config';

const nextUpload = new NextUpload(nextUploadConfig);

export const POST = (request: NextRequest) => nextUpload.POST(request);
```

**src/components/FileUpload.tsx**

```tsx
'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { upload } from 'next-upload/client';
import { NextUploadType, nextUploadConfig } from '@/app/upload/config';

const FileUpload = () => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    await Promise.all(
      acceptedFiles.map(async (file) => {
        await upload({
          file,
          args: {
            type: NextUploadType.image,
            name: file.name,
          },
          config: nextUploadConfig,
        });
      })
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
