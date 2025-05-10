export { Hono as Server } from "hono";
export * from "hono";
import { zValidator as zv } from "@hono/zod-validator";
import { ZodSchema } from "zod";
import { actionFailure } from "@recommand/lib/utils";
import type { ValidationTargets } from "hono/types";

export const zValidator = <
  T extends ZodSchema,
  Target extends keyof ValidationTargets
>(
  target: Target,
  schema: T
) => {
  return zv(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(actionFailure(result.error), 422);
    }
  });
};
