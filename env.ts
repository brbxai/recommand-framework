import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Find the monorepo root by walking up until we find a package.json with workspaces
function findMonorepoRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    const pkgPath = path.join(dir, "package.json");
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.workspaces) {
        return dir;
      }
    } catch {}
    const parent = path.dirname(dir);
    if (parent === dir) {
      return startDir;
    }
    dir = parent;
  }
}

const root = findMonorepoRoot(__dirname);
dotenv.config({ path: path.join(root, ".env") });
