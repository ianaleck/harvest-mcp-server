/**
 * Schema validation utilities for Harvest MCP Server
 * Provides reusable validation functions and helpers
 */

import { z } from 'zod';
import { handleValidationError } from './errors';

export function validateInput<T>(
  schema: z.ZodSchema<T>, 
  input: unknown, 
  context: string
): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleValidationError(error, context);
    }
    throw error;
  }
}

export function validateOptionalInput<T>(
  schema: z.ZodSchema<T>, 
  input: unknown, 
  context: string
): T | undefined {
  if (input === undefined || input === null) {
    return undefined;
  }
  
  return validateInput(schema, input, context);
}

export function safeValidate<T>(
  schema: z.ZodSchema<T>, 
  input: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(input);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

export function createIdValidator(fieldName: string = 'id') {
  return z.number().int().positive({
    message: `${fieldName} must be a positive integer`
  });
}

export function createDateValidator(fieldName: string = 'date') {
  return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: `${fieldName} must be in YYYY-MM-DD format`
  });
}

export function createDateTimeValidator(fieldName: string = 'datetime') {
  return z.string().datetime({ offset: true }).refine(
    (value) => !isNaN(Date.parse(value)),
    { message: `${fieldName} must be a valid ISO datetime with offset` }
  );
}

export function createTimeValidator(fieldName: string = 'time') {
  return z.string().regex(/^([0-1]?\d|2[0-3]):[0-5]\d$/, {
    message: `${fieldName} must be in HH:MM format (24-hour)`
  });
}

export function createCurrencyValidator(fieldName: string = 'currency') {
  return z.string().length(3, {
    message: `${fieldName} must be a 3-letter ISO currency code (e.g., USD, EUR)`
  });
}

export function createEmailValidator(fieldName: string = 'email') {
  return z.string().email({
    message: `${fieldName} must be a valid email address`
  });
}

export function createUrlValidator(fieldName: string = 'url') {
  return z.string().url({
    message: `${fieldName} must be a valid URL`
  });
}

export function createEnumValidator<T extends string>(
  values: readonly T[], 
  fieldName: string = 'field'
) {
  return z.enum(values as [T, ...T[]], {
    errorMap: () => ({
      message: `${fieldName} must be one of: ${values.join(', ')}`
    })
  });
}

export function createOptionalStringValidator(
  fieldName: string = 'field',
  minLength?: number,
  maxLength?: number
) {
  let validator = z.string();
  
  if (minLength !== undefined) {
    validator = validator.min(minLength, {
      message: `${fieldName} must be at least ${minLength} characters long`
    });
  }
  
  if (maxLength !== undefined) {
    validator = validator.max(maxLength, {
      message: `${fieldName} must be no more than ${maxLength} characters long`
    });
  }
  
  return validator.optional();
}

export function createRangeValidator(
  min: number, 
  max: number, 
  fieldName: string = 'field'
) {
  return z.number().min(min, {
    message: `${fieldName} must be at least ${min}`
  }).max(max, {
    message: `${fieldName} must be no more than ${max}`
  });
}

export function createPercentageValidator(fieldName: string = 'percentage') {
  return createRangeValidator(0, 100, fieldName);
}