import { useState } from 'react';
import {
  NextUploadClientConfig,
  SignedPostPolicy,
  UploadOptions,
} from './types';
import { upload as _upload } from './upload';

export const useNextUpload = (config: NextUploadClientConfig = {}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [signedPostPolicies, setSignedPostPolicies] = useState<
    SignedPostPolicy[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (options: UploadOptions | UploadOptions[]) => {
    setIsUploading(true);
    const acceptedFiles = (options instanceof Array ? options : [options]).map(
      (x) => x.file
    );
    setFiles((prev) => [...prev, ...acceptedFiles]);
    _upload(options, config)
      .then((res) => {
        setSignedPostPolicies((prev) => [...prev, ...res]);
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  const reset = () => {
    setFiles([]);
    setSignedPostPolicies([]);
  };

  return {
    files,
    setFiles,
    signedPostPolicies,
    setSignedPostPolicies,
    isUploading,
    setIsUploading,
    upload,
    reset,
  };
};
