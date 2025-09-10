/**
 * Validation Utils Unit Tests
 */

// Set test environment variables before any imports
process.env.HARVEST_ACCESS_TOKEN = 'test_token_12345';
process.env.HARVEST_ACCOUNT_ID = '123456';

import { z } from 'zod';
import { validateInput } from '../../../src/utils/validation';
import { ValidationError } from '../../../src/utils/errors';

describe('validateInput', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
    email: z.string().email().optional(),
    is_active: z.boolean().optional(),
  });

  it('should validate valid input successfully', () => {
    const validInput = {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
      is_active: true
    };

    const result = validateInput(testSchema, validInput, 'test');
    
    expect(result).toEqual(validInput);
  });

  it('should validate input without optional fields', () => {
    const validInput = {
      name: 'Jane Doe',
      age: 25
    };

    const result = validateInput(testSchema, validInput, 'test');
    
    expect(result.name).toBe('Jane Doe');
    expect(result.age).toBe(25);
    expect(result.email).toBeUndefined();
    expect(result.is_active).toBeUndefined();
  });

  it('should throw ValidationError for invalid input', () => {
    const invalidInput = {
      name: '', // Too short
      age: -5, // Not positive
      email: 'invalid-email' // Invalid email format
    };

    expect(() => {
      validateInput(testSchema, invalidInput, 'test context');
    }).toThrow(ValidationError);

    expect(() => {
      validateInput(testSchema, invalidInput, 'test context');
    }).toThrow('Invalid parameters');
  });

  it('should throw ValidationError for missing required fields', () => {
    const invalidInput = {
      email: 'test@example.com'
      // Missing name and age
    };

    expect(() => {
      validateInput(testSchema, invalidInput, 'test');
    }).toThrow(ValidationError);
  });

  it('should throw ValidationError for wrong types', () => {
    const invalidInput = {
      name: 123, // Should be string
      age: 'thirty', // Should be number
      is_active: 'yes' // Should be boolean
    };

    expect(() => {
      validateInput(testSchema, invalidInput, 'test');
    }).toThrow(ValidationError);
  });

  it('should handle empty input object', () => {
    expect(() => {
      validateInput(testSchema, {}, 'test');
    }).toThrow(ValidationError);
  });

  it('should handle null input', () => {
    expect(() => {
      validateInput(testSchema, null, 'test');
    }).toThrow(ValidationError);
  });

  it('should handle undefined input', () => {
    expect(() => {
      validateInput(testSchema, undefined, 'test');
    }).toThrow(ValidationError);
  });
});

describe('Enum validation', () => {
  const enumSchema = z.object({
    status: z.enum(['active', 'inactive', 'pending'])
  });

  it('should validate valid enum values', () => {
    const validInput = { status: 'active' };
    const result = validateInput(enumSchema, validInput, 'enum test');
    expect(result.status).toBe('active');
  });

  it('should reject invalid enum values', () => {
    const invalidInput = { status: 'unknown' };
    expect(() => {
      validateInput(enumSchema, invalidInput, 'enum test');
    }).toThrow(ValidationError);
  });
});

describe('Array validation', () => {
  const arraySchema = z.object({
    tags: z.array(z.string()).min(1),
    numbers: z.array(z.number()).optional()
  });

  it('should validate arrays correctly', () => {
    const validInput = {
      tags: ['tag1', 'tag2'],
      numbers: [1, 2, 3]
    };
    
    const result = validateInput(arraySchema, validInput, 'array test');
    expect(result.tags).toEqual(['tag1', 'tag2']);
    expect(result.numbers).toEqual([1, 2, 3]);
  });

  it('should reject empty arrays when minimum is required', () => {
    const invalidInput = { tags: [] };
    expect(() => {
      validateInput(arraySchema, invalidInput, 'array test');
    }).toThrow(ValidationError);
  });

  it('should reject arrays with wrong element types', () => {
    const invalidInput = { tags: [123, 'tag2'] };
    expect(() => {
      validateInput(arraySchema, invalidInput, 'array test');
    }).toThrow(ValidationError);
  });
});