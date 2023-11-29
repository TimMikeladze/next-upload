declare global {
  namespace NodeJS {
    interface ProcessEnv {
      S3_ACCESS_KEY: string;
      S3_ENDPOINT: string;
      S3_REGION: string;
      S3_SECRET_KEY: string;
      PG_CONNECTION_STRING: string;
      PG_DB: string;
    }
  }
}

export {};
