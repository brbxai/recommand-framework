import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { ulid } from "ulid";
import { sql } from "drizzle-orm";

export const migrations = pgTable("__recommand_migrations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => "migration_" + ulid()),
  filename: text("filename").notNull(),
  app: text("app").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),
}, (t) => [
  index("filename_idx").on(t.filename),
  index("app_idx").on(t.app),
]);