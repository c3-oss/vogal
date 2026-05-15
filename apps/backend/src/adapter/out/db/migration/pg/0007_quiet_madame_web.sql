CREATE SCHEMA "chats";
--> statement-breakpoint
CREATE TABLE "chats"."chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_ext" varchar(32) NOT NULL,
	"chat_id" integer NOT NULL,
	"role" varchar(16) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_messages_id_ext_unique" UNIQUE("id_ext")
);
--> statement-breakpoint
CREATE TABLE "chats"."chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_ext" varchar(32) NOT NULL,
	"workspace_id" integer NOT NULL,
	"title" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chats_id_ext_unique" UNIQUE("id_ext")
);
--> statement-breakpoint
ALTER TABLE "chats"."chat_messages" ADD CONSTRAINT "chat_messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "chats"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats"."chats" ADD CONSTRAINT "chats_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chat_id" ON "chats"."chat_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_id" ON "chats"."chats" USING btree ("workspace_id");