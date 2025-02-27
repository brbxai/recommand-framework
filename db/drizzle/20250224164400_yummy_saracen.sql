CREATE TABLE "__recommand_migrations" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"app" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "filename_idx" ON "__recommand_migrations" USING btree ("filename");--> statement-breakpoint
CREATE INDEX "app_idx" ON "__recommand_migrations" USING btree ("app");