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
