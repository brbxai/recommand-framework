import type { Hono } from "hono";
import { join } from "node:path";
import { type RecommandApp } from "./app";
import { frameworkLogger } from "./logger";
import { serveStatic } from "hono/bun";
import { existsSync, readdirSync } from "node:fs";

export async function attach(
  app: RecommandApp,
  hono: Hono
): Promise<{ indexOverride: string | null }> {
  frameworkLogger.info(`Loading ${app.name} from ${app.absolutePath}`);
  const appModule = await import(join(app.absolutePath, "index.ts"));
  await appModule.init(app, hono);
  try {
    hono.route(["api", app.apiMount ?? app.name].filter(Boolean).join("/"), appModule.default);
  } catch (e) {
    frameworkLogger.error(`Failed to register api routes for ${app.name}`);
  }

  // For each file in the public folder, register a root route
  let indexOverride: string | null = null;
  const publicPath = join(app.absolutePath, "public");
  if (existsSync(publicPath)) {
    const files = readdirSync(publicPath);

    // Check for index.html and set it as the indexOverride
    if (files.includes("index.html")) {
      indexOverride = join(publicPath, "index.html");
    }

    files.forEach((file: string) => {
      hono.get(`/${file}/*`, serveStatic({ root: publicPath }));
    });
  }

  frameworkLogger.info(`${app.name} is loaded`);

  return { indexOverride };
}