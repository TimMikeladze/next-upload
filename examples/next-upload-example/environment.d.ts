declare global {
  namespace NodeJS {
    interface ProcessEnv {
      S3_ACCESS_KEY: string;
      S3_ENDPOINT: string;
      S3_REGION: string;
      S3_SECRET_KEY: string;
      PG_DB: string;
      PG_CONNECTION_STRING: string;
      NEXT_PUBLIC_MAX_SIZE: string | undefined;
      CRON_KEY: string;
    }
  }
}

export {};
