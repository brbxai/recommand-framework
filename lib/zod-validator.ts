import type { ValidationTargets } from 'hono';
import type { z } from 'zod';
import { validator as baseZValidator } from "hono-openapi/zod";
import { actionFailure } from './utils';

export function zodValidator<
    T extends z.ZodType,
    Target extends keyof ValidationTargets,
>(
    target: Target,
    schema: T,
) {
    return baseZValidator(target, schema, (result, c) => {
        if (!result.success) {
            return c.json(actionFailure(result.error), 400);
        }
    });
}
