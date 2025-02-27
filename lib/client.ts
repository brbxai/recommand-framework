import type { Hono } from "hono";
import { hc } from "hono/client";

/**
 * Create a Recommand client for the given url
 * @param url The url of the Recommand app
 * @returns A client for the given url
 */
export function rc<T extends Hono<any, any, any>>(url: string) {
  return hc<T>('http://localhost:3000/api/' + url);
}
