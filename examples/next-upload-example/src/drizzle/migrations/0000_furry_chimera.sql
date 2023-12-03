CREATE TABLE IF NOT EXISTS "next_upload_assets" (
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"expires" bigint,
	"presignedUrl" varchar,
	"presignedUrlExpires" bigint
);
