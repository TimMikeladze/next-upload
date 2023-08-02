'use client';

import { useDropzone } from 'react-dropzone';
import { upload } from 'next-upload/client';
import { NextUploadType, config } from '@/app/upload/config';
import toast from 'react-hot-toast';
import bytes from 'bytes';

const FileUpload = () => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.png'],
    },
    maxSize: bytes.parse(config.maxSize),
    onDropRejected: () =>
      toast.error(`Maximum file upload size is ${config.maxSize}`),
    onDropAccepted: (acceptedFiles) => {
      return toast.promise(
        upload(
          acceptedFiles.map((file) => ({
            file,
            uploadType: NextUploadType.image,
            metadata: {
              lastModified: file.lastModified,
            },
          })),
          config
        ),
        {
          loading: 'Uploading...',
          success: 'Uploaded!',
          error: 'Error uploading',
        }
      );
    },
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
