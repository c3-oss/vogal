CREATE SCHEMA "documents";
--> statement-breakpoint
CREATE TABLE "documents"."documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_ext" varchar(32) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "documents_id_ext_unique" UNIQUE("id_ext")
);
--> statement-breakpoint
CREATE INDEX "idx_filename" ON "documents"."documents" USING btree ("filename");