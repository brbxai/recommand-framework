import type { Env, ValidationTargets } from 'hono';
import type { z } from 'zod';
import { validator as baseZValidator, resolver as baseZResolver } from "hono-openapi/zod";

export function zodValidator<
    T extends z.ZodType,
    Target extends keyof ValidationTargets,
    E extends Env,
    P extends string,
>(
    target: Target,
    schema: T,
) {
    return baseZValidator<T, Target, E, P>(target, schema, (result, c) => {
        if (!result.success) {
            const {invalidInputDetails, listedErrors} = cleanZodError(result.error as z.ZodError);
            return c.json({
                errors: {
                    ...listedErrors,
                },
                invalidInputDetails,
            }, 400);
        }
    });
}

export function zodResolver(schema: z.ZodType) {
    return baseZResolver(schema);
}

const cleanZodError = (error: z.ZodError): {invalidInputDetails: any[], listedErrors: {[key: string]: string[]}} => {
    // Output the error in a more readable format with path and message for each error
    const errorsArray = [];
    const listedErrors: {[key: string]: string[]} = {};
    for (const issue of error.issues) {
        if (issue.code === 'invalid_union') {
            const outerErrors = [];
            for (const unionError of issue.unionErrors) {
                console.log(JSON.stringify(unionError, null, 2));
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
            listedErrors[issue.path.join('.')] = [`Invalid union, make sure your input is consistent with one of the possible types for ${issue.path.join('.')}.`];
        }else{
            errorsArray.push({
                path: issue.path.join('.'),
                message: issue.message,
            });
            listedErrors[issue.path.join('.')] = [issue.path.join('.') + ": " + issue.message];
        }
    }
    return {invalidInputDetails: errorsArray, listedErrors: listedErrors};
};