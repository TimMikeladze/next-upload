'use client';

import { useDropzone } from 'react-dropzone';
import { useNextUpload } from 'next-upload/react';
import toast from 'react-hot-toast';
import bytes from 'bytes';

const maxSize = process.env.NEXT_PUBLIC_MAX_SIZE || '1mb';

export interface FileUploadProps {
  api: string;
  title: string;
}

const FileUpload = (props: FileUploadProps) => {
  const nup = useNextUpload({
    api: props.api,
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': [],
    },
    maxSize: bytes.parse(maxSize),
    onDropRejected: () => toast.error(`Maximum file upload size is ${maxSize}`),
    onDropAccepted: (acceptedFiles) => {
      return toast.promise(
        nup.upload(
          acceptedFiles.map((file) => ({
            file,
            uploadType: props.api.split('/').pop(),
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
    <div
      {...getRootProps()}
      style={{
        padding: '1rem',
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginBottom: '2rem',
      }}
    >
      <div
        style={{
          marginBottom: '1rem',
        }}
      >
        <h4>{props.title}</h4>
      </div>
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click here to select files</p>
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
