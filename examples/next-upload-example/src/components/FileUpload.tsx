'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { upload } from 'next-upload/client';
import { NextUploadType, config } from '@/app/upload/config';
import toast from 'react-hot-toast';

const FileUpload = () => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    toast.promise(
      upload(
        acceptedFiles.map((file) => ({
          file,
          type: NextUploadType.image,
        })),
        config
      ),
      {
        loading: 'Uploading...',
        success: 'Uploaded!',
        error: 'Error uploading',
      }
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
