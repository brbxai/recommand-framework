import type { RecommandApp } from "../lib/app";
import { db } from "@db/index";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { migrations } from "@db/schema";
import { sql } from "drizzle-orm";

export async function migrateApp(app: RecommandApp) {
  const migrationsPath = join(app.absolutePath, "db", "drizzle");

  // Load all sql files in the migrations path, sorted by filename
  const migrationFiles = await readdir(migrationsPath);
  const sortedMigrations = migrationFiles.sort();

  for (const migrationFilename of sortedMigrations) {
    if (!migrationFilename.endsWith(".sql")) continue;

    const migrationContent = await readFile(
      join(migrationsPath, migrationFilename),
      "utf-8"
    );

    // Wrap each migration in a transaction
    await db.transaction(async (tx) => {
      // Check if migrations table exists
      const tableExists = await tx.execute(sql`
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = '__recommand_migrations'
        );
    `);

      if (tableExists.rows[0].exists) {
        // Check if the migration is already applied
        const migrationRecords = await tx
          .select()
          .from(migrations)
          .where(
            and(
              eq(migrations.filename, migrationFilename),
              eq(migrations.app, app.name)
            )
          );

        if (migrationRecords.length > 0) return;
      }

      // Execute the migration
      await tx.execute(migrationContent);

      // Record the migration
      await tx.insert(migrations).values({
        filename: migrationFilename,
        app: app.name,
      });
    });
  }
}
