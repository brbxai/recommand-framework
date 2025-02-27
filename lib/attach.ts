import type { Hono } from "hono";
import { join } from "node:path";
import { type RecommandApp } from "./app";
import { frameworkLogger } from "./logger";
export async function attach(app: RecommandApp, hono: Hono): Promise<void> {
    frameworkLogger.info(`Loading ${app.name} from ${app.absolutePath}`);
    const appModule = await import(join(app.absolutePath, "index.ts"));
    await appModule.init(app, hono);
    try{
        hono.route("api/" + app.name, appModule.default);
    }catch(e){
        frameworkLogger.error(`Failed to register api routes for ${app.name}`);
    }
    frameworkLogger.info(`${app.name} is loaded`);
}