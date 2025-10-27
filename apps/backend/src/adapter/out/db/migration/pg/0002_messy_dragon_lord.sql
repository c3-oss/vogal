CREATE TABLE "documents"."document_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents"."document_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"page_number" integer NOT NULL,
	"raw_content" text NOT NULL,
	"normalized_content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents"."document_metadata" ADD CONSTRAINT "document_metadata_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "documents"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents"."document_pages" ADD CONSTRAINT "document_pages_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "documents"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_doc_meta" ON "documents"."document_metadata" USING btree ("document_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_doc_page" ON "documents"."document_pages" USING btree ("document_id","page_number");--> statement-breakpoint
ALTER TABLE "documents"."documents" DROP COLUMN "content";