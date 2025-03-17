import { readdir } from "node:fs/promises";
import { stat } from "node:fs/promises";
import { join } from "node:path";

export type RecommandApp = {
    name: string;
    absolutePath: string;
}

export async function getApps(): Promise<RecommandApp[]> {
    const apps: RecommandApp[] = [];
    const rootDir = process.cwd().split('/').slice(0, -1).join('/'); // Get parent directory
    
    // Get all items from the parent directory with readdir
    const items = await readdir(rootDir);
    
    // Filter for directories only
    for (const item of items) {
        const fullPath = join(rootDir, item);
        const stats = await stat(fullPath);
        
        if (stats.isDirectory() && item !== "recommand-framework" && !item.startsWith(".") && item !== "node_modules") {
            apps.push({ name: item, absolutePath: fullPath });
        }
    }

    return apps;
}