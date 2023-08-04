'use client';

import { useDropzone } from 'react-dropzone';
import { useNextUpload } from 'next-upload/react';
import toast from 'react-hot-toast';
import bytes from 'bytes';
import { NextUploadType } from '@/app/upload/config';

const maxSize = process.env.NEXT_PUBLIC_MAX_SIZE || '1mb';

const FileUpload = () => {
  const nup = useNextUpload();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.png'],
    },
    maxSize: bytes.parse(maxSize),
    onDropRejected: () => toast.error(`Maximum file upload size is ${maxSize}`),
    onDropAccepted: (acceptedFiles) => {
      return toast.promise(
        nup.upload(
          acceptedFiles.map((file) => ({
            file,
            uploadType: NextUploadType.image,
            metadata: {
              lastModified: file.lastModified,
            },
          }))
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
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>
      {nup.files.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2rem',
            marginTop: '2rem',
          }}
        >
          {nup.files.map((x, index) => (
            <img
              key={x.webkitRelativePath + index}
              src={URL.createObjectURL(x)}
              style={{
                objectFit: 'contain',
                maxWidth: 300,
                width: '100%',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
