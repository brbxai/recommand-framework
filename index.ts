import { Hono } from "hono";
import { getApps } from "./lib/app";
import { attach } from "./lib/attach";
import { migrateApp } from "./lib/migrate";
import { cors } from "hono/cors";
import { proxy } from "hono/proxy";
import { serveStatic } from "hono/bun";
import fs from "fs/promises";
import path from "path";
import { openAPISpecs } from "hono-openapi";
import { apiReference } from "@scalar/hono-api-reference";

const isDev = process.env.NODE_ENV === "development";

const hono = new Hono();

hono.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

const apps = await getApps();
await migrateApp({
  name: "__recommand_framework",
  absolutePath: __dirname,
});
for (const app of apps) {
  // Load the .env file for the app, if it exists
  const envPath = path.resolve(app.absolutePath, ".env");
  if (await fs.exists(envPath)) {
    const env = await fs.readFile(envPath, "utf-8");
    const envVars = env.split("\n").map((line) => line.split("="));
    for (const [key, value] of envVars) {
      process.env[key.trim()] = value.trim();
    }
  }
  // Migrate the app
  await migrateApp(app);
  // Attach the app to the hono instance
  await attach(app, hono);
}

hono.get(
  "/openapi",
  openAPISpecs(hono, {
    documentation: {
      info: {
        title: "Recommand API",
        version: "1.0.0",
        description: "Recommand API",
      },
      servers: [{ url: "http://localhost:3000", description: "Local Server" }],
    },
  })
);

hono.get(
  "/docs",
  apiReference({
    theme: "saturn",
    // @ts-ignore
    spec: { url: "/openapi" },
  })
)

if (isDev) {
  // For all other routes, proxy to the app on port 5173
  hono.all("*", async (c) => {
    const response = await proxy(`http://localhost:5173/${c.req.path}`, {
      ...c.req,
    });

    // Add cache control headers to the response
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  });
} else {
  // For all other routes, return static files from the dist folder
  const distPath = path.resolve("./app/dist");
  const publicDirFilenames = await fs.readdir(distPath);

  hono.get(
    "*",
    serveStatic({
      rewriteRequestPath: (requestPath) => {
        // Normalize the path to prevent directory traversal
        const normalizedPath = path
          .normalize(requestPath)
          .replace(/^(\.\.(\/|\\|$))+/, "");
        console.log("normalizedPath", normalizedPath);

        // Resolve the full path
        const fullPath = path.join(distPath, normalizedPath);

        // Ensure the resolved path is within the dist directory
        if (!fullPath.startsWith(distPath)) {
          return "./app/dist/index.html";
        }

        // Check if the file exists in the dist directory
        const relativePath = path.relative(distPath, fullPath);
        if (publicDirFilenames.includes(relativePath.split(path.sep)[0])) {
          return `./app/dist/${normalizedPath}`;
        }

        // Default to index.html for all other routes
        return "./app/dist/index.html";
      },
    })
  );
}

export default hono;
