/* eslint-disable class-methods-use-this */
import { PostPolicy } from 'minio';
import { NextUploadS3Client } from './types';

export class InMemoryS3Client implements NextUploadS3Client {
  public regions = new Set<string>();

  public buckets = new Map<string, any>();

  reset() {
    this.regions.clear();
    this.buckets.clear();
  }

  bucketExists(bucketName: string): Promise<boolean> {
    return Promise.resolve(this.buckets.has(bucketName));
  }

  makeBucket(bucketName: string, region: string): Promise<void> {
    this.regions.add(region);
    this.buckets.set(bucketName, {});
    return Promise.resolve();
  }

  newPostPolicy() {
    return new PostPolicy();
  }

  presignedPostPolicy() {
    return Promise.resolve({
      formData: {},
      postURL: '',
    });
  }
}
