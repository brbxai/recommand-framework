import type { RecommandApp } from "./app";
import { db } from "@db/index";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { migrations } from "@db/schema";
import { sql } from "drizzle-orm";
import { frameworkLogger } from "./logger";

type MigrationInfo = {
  app: RecommandApp;
  filename: string;
  path: string;
  content: string;
};

export async function migrateAllApps(apps: RecommandApp[]) {
  // First the framework migrations
  const frameworkApp = apps.find((app) => app.name === "__recommand_framework");
  if (frameworkApp) {
    const frameworkMigrations = await collectMigrationsFromApp(frameworkApp);
    frameworkMigrations.sort((a, b) => a.filename.localeCompare(b.filename));
    for (const migration of frameworkMigrations) {
      await applyMigration(migration);
    }
  }

  // Then all other apps
  const allMigrations: MigrationInfo[] = [];
  for (const app of apps) {
    if (app.name === "__recommand_framework") continue; // Skip framework as it's already processed
    allMigrations.push(...(await collectMigrationsFromApp(app)));
  }

  // Sort all app migrations chronologically by filename
  allMigrations.sort((a, b) => a.filename.localeCompare(b.filename));

  // Apply migrations in chronological order
  for (const migration of allMigrations) {
    await applyMigration(migration);
  }
}

async function collectMigrationsFromApp(
  app: RecommandApp
): Promise<MigrationInfo[]> {
  const allMigrations: MigrationInfo[] = [];
  const migrationsPath = join(app.absolutePath, "db", "drizzle");

  try {
    const migrationFiles = await readdir(migrationsPath);

    for (const filename of migrationFiles) {
      if (!filename.endsWith(".sql")) continue;

      const filePath = join(migrationsPath, filename);
      const content = await readFile(filePath, "utf-8");

      allMigrations.push({
        app,
        filename,
        path: filePath,
        content,
      });
    }
  } catch (error) {
    // Skip if the migrations directory doesn't exist
    frameworkLogger.warn(`No migrations found for app: ${app.name}`);
  }

  return allMigrations;
}

async function applyMigration(migration: {
  app: RecommandApp;
  filename: string;
  content: string;
}) {
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
            eq(migrations.filename, migration.filename),
            eq(migrations.app, migration.app.name)
          )
        );

      if (migrationRecords.length > 0) return;
    }

    // Execute the migration
    await tx.execute(migration.content);

    // Record the migration
    await tx.insert(migrations).values({
      filename: migration.filename,
      app: migration.app.name,
    });

    frameworkLogger.info(
      `Applied migration: ${migration.filename} for app: ${migration.app.name}`
    );
  });
}
