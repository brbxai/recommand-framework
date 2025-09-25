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
            return c.json({
                errors: {
                    ...actionFailure(result.error).errors,
                    invalidInputDetails: cleanZodError(result.error),
                },
            }, 400);
        }
    });
}

const cleanZodError = (error: z.ZodError): any[] => {
    // Output the error in a more readable format with path and message for each error
    const errorsArray = [];
    for (const issue of error.issues) {
        if (issue.code === 'invalid_union') {
            const outerErrors = [];
            for (const unionError of issue.unionErrors) {
                const innerErrors = [];
                for (const unionErrorIssue of unionError.issues) {
                    innerErrors.push({
                        path: unionErrorIssue.path.join('.'),
                        message: unionErrorIssue.message,
                    });
                }
                outerErrors.push(innerErrors);
            }
            errorsArray.push({
                path: issue.path.join('.'),
                message: "Invalid union, fix at least one of the following errors depending on the input type you are targeting.",
                unionErrors: outerErrors,
            });
        }else{
            errorsArray.push({
                path: issue.path.join('.'),
                message: issue.message,
            });
        }
    }
    return errorsArray;
};