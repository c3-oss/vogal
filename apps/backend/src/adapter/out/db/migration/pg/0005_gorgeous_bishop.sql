CREATE TYPE "public"."storage_provider" AS ENUM('s3', 'firebase');--> statement-breakpoint
CREATE TABLE "documents"."document_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"provider" "storage_provider" NOT NULL,
	"bucket" varchar(255) NOT NULL,
	"object_key" text NOT NULL,
	"public_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents"."document_files" ADD CONSTRAINT "document_files_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "documents"."documents"("id") ON DELETE cascade ON UPDATE no action;