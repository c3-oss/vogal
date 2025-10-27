CREATE TYPE "public"."document_status" AS ENUM('pending', 'processing', 'failed', 'ready');--> statement-breakpoint
CREATE TYPE "public"."upload_step" AS ENUM('pending', 'storage_upload', 'file_reference', 'content_indexed', 'finalized');--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ALTER COLUMN "status" SET DEFAULT 'queued';--> statement-breakpoint
ALTER TABLE "documents"."documents" ADD COLUMN "status" "document_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents"."documents" ADD COLUMN "failure_reason" text;--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "job_id_ext" varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "document_id_ext" varchar(26) NOT NULL;--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "workspace_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "workspace_id_ext" varchar(26) NOT NULL;--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "filename" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "content_type" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "temp_file_path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "storage_provider" varchar(20);--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "storage_bucket" varchar(255);--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "storage_object_key" varchar(512);--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "current_step" "upload_step" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "last_completed_step" "upload_step";--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "retry_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "finished_at" timestamp;--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD COLUMN "heartbeat_at" timestamp;--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD CONSTRAINT "document_uploads_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents"."document_uploads" ADD CONSTRAINT "document_uploads_job_id_ext_unique" UNIQUE("job_id_ext");