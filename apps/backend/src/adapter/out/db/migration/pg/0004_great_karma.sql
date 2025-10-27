CREATE TYPE "public"."upload_status" AS ENUM('queued', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "documents"."document_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"status" "upload_status" NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD CONSTRAINT "document_uploads_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "documents"."documents"("id") ON DELETE cascade ON UPDATE no action;