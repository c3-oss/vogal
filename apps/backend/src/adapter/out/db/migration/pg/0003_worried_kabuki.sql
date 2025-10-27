CREATE SCHEMA "users";
--> statement-breakpoint
CREATE SCHEMA "workspaces";
--> statement-breakpoint
CREATE TABLE "users"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_ext" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_id_ext_unique" UNIQUE("id_ext"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspaces"."workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_ext" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"user_id" integer NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_id_ext_unique" UNIQUE("id_ext")
);
--> statement-breakpoint
ALTER TABLE "documents"."documents" ADD COLUMN "workspace_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces"."workspaces" ADD CONSTRAINT "workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_email" ON "users"."users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_user_id" ON "workspaces"."workspaces" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "documents"."documents" ADD CONSTRAINT "documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_workspace_id" ON "documents"."documents" USING btree ("workspace_id");