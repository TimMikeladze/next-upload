declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MINIO_ACCESS_KEY: string;
      MINIO_ENDPOINT: string;
      MINIO_PORT: string;
      MINIO_REGION: string;
      MINIO_SECRET_KEY: string;
      MINIO_SSL?: 'true' | undefined;
    }
  }
}

export {};
