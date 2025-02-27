import type { RecommandApp } from "./app";

export function log(message: unknown[], type: "info" | "warn" | "error" = "info") {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}]`;

    if(type === "info") {
        console.log(prefix, ...message);
    } else if(type === "warn") {
        // Print in orange
        console.warn(`\x1b[33m${prefix}`, ...message, `\x1b[0m`);
    } else if(type === "error") {
        // Print in red
        console.error(`\x1b[31m${prefix}`, ...message, `\x1b[0m`);
    }
}

export class Logger {
    constructor(private readonly app?: RecommandApp) {}

    log(...message: unknown[]) {
        this.info(...message);
    }

    info(...message: unknown[]) {
        log([`[${this.app?.name ?? "🚀"}]`, ...message], "info");
    }

    warn(...message: unknown[]) {
        log([`[${this.app?.name ?? "🚀"}]`, ...message], "warn");
    }

    error(...message: unknown[]) {
        log([`[${this.app?.name ?? "🚀"}]`, ...message], "error");
    }
}

export const frameworkLogger = new Logger();