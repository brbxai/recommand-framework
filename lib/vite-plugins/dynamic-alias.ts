import type { Plugin } from "vite";
import { getApps } from "../app";

export default function DynamicAliasPlugin(): Plugin {
  return {
    name: "dynamic-alias",

    async config(userConfig, env) {
      // Build a dynamic alias for the apps
      const apps = await getApps();

      const dynamicAlias: Record<string, string> = {};

      for (const app of apps) {
        dynamicAlias[`@${app.name}`] = app.absolutePath;
      }

      return {
        resolve: {
          alias: {
            ...dynamicAlias,
            ...userConfig.resolve?.alias,
          },
        },
      };
    },
  };
}
