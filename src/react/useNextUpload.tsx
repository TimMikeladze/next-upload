import { useState } from 'react';
import { GeneratePresigned, UploadOptions, UseNextUploadArgs } from '../types';
import { upload as _upload } from '../client/upload';

export const useNextUpload = (config: UseNextUploadArgs = {}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [generatePresignedList, setGeneratePresignedList] = useState<
    GeneratePresigned[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (options: UploadOptions | UploadOptions[]) => {
    setIsUploading(true);
    const acceptedFiles = (options instanceof Array ? options : [options]).map(
      (x) => x.file
    );
    setFiles((prev) => [...prev, ...acceptedFiles]);

    try {
      const res = await _upload(options, config);
      await setGeneratePresignedList((prev) => [...prev, ...res]);
    } catch (error) {
      if (config.onError) {
        config.onError(error as Error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setGeneratePresignedList([]);
  };

  return {
    files,
    setFiles,
    signedPostPolicies: generatePresignedList,
    setSignedPostPolicies: setGeneratePresignedList,
    isUploading,
    setIsUploading,
    upload,
    reset,
  };
};
