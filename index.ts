import { Hono } from "hono";
import { getApps } from "./lib/app";
import { attach } from "./lib/attach";
import { migrateApp } from "./lib/migrate";
import { cors } from 'hono/cors';
import { proxy } from "hono/proxy";
import { serveStatic } from 'hono/bun';
import fs from "fs/promises";
import path from "path";

const isDev = process.env.NODE_ENV === "development";

const hono = new Hono();

hono.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

const apps = await getApps();
await migrateApp({
  name: "__recommand_framework",
  absolutePath: __dirname,
});
for (const app of apps) {
  await migrateApp(app);
  await attach(app, hono);
}

if(isDev){
  // For all other routes, proxy to the app on port 5173
  hono.all("*", async (c) => {
    return proxy(`http://localhost:5173/${c.req.path}`, {
      ...c.req,
    });
  });
}else{
  // For all other routes, return static files from the dist folder
  const distPath = path.resolve("./app/dist");
  const publicDirFilenames = await fs.readdir(distPath);
  
  hono.get("*", serveStatic({
    rewriteRequestPath: (requestPath) => {
      // Normalize the path to prevent directory traversal
      const normalizedPath = path.normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/, '');
      console.log("normalizedPath", normalizedPath);
      
      // Resolve the full path
      const fullPath = path.join(distPath, normalizedPath);
      
      // Ensure the resolved path is within the dist directory
      if (!fullPath.startsWith(distPath)) {
        return './app/dist/index.html';
      }
      
      // Check if the file exists in the dist directory
      const relativePath = path.relative(distPath, fullPath);
      if (publicDirFilenames.includes(relativePath.split(path.sep)[0])) {
        return `./app/dist/${normalizedPath}`;
      }
      
      // Default to index.html for all other routes
      return './app/dist/index.html';
    }
  }));
}

export default hono;
