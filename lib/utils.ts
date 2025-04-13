import { z } from "zod";

/**
 * Helper for returning successful action results with optional data
 * @example
 * // Simple success
 * return actionSuccess();
 *
 * // Success with data
 * return actionSuccess({ user: { id: 1, name: 'John' } });
 */
export function actionSuccess<T = {}>(
  data: T = {} as T,
): { success: true; errors: undefined } & T {
  return {
    success: true,
    errors: undefined,
    ...data,
  };
}

/**
 * Helper for returning action failures with validation or error messages
 * @example
 * // Simple error message
 * return actionFailure("Invalid credentials");
 *
 * // Multiple error messages
 * return actionFailure("Server error", "Please try again");
 *
 * // Zod validation errors
 * const result = schema.safeParse(data);
 * if (!result.success) return actionFailure(result.error);
 */
export function actionFailure(
  ...errors: { [key: string]: string[] }[] | z.ZodError[] | string[] | Error[]
): {
  success: false;
  errors: { [key: string]: string[] | undefined };
} {
  let resultingErrors: { [key: string]: string[] | undefined };

  if (errors[0] instanceof z.ZodError) {
    resultingErrors = (errors[0] as z.ZodError).flatten().fieldErrors;
  } else if (Array.isArray(errors[0])) {
    resultingErrors = errors[0] as { [key: string]: string[] };
  } else if (errors[0] instanceof Error) {
    resultingErrors = { root: [errors[0].message] };
  } else {
    resultingErrors = { root: errors as string[] };
  }

  return {
    success: false,
    errors: resultingErrors,
  };
}

export function stringifyActionFailure(errors: {
  [key: string]: string[] | undefined;
}): string {
  const resultingErrors = Object.values(errors)
    .filter((v) => v !== undefined)
    .flat();

  return resultingErrors ? " " + resultingErrors.join(", ") : "";
}