import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { ulid } from "ulid";
import { sql } from "drizzle-orm";
import { autoUpdateTimestamp } from "@recommand/db/custom-types";

export const migrations = pgTable("__recommand_migrations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => "migration_" + ulid()),
  filename: text("filename").notNull(),
  app: text("app").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: autoUpdateTimestamp(),
}, (t) => [
  index("filename_idx").on(t.filename),
  index("app_idx").on(t.app),
]);