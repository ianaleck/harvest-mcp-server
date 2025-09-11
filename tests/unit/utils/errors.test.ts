/**
 * Error Utils Unit Tests
 */

// Set test environment variables before any imports
process.env.HARVEST_ACCESS_TOKEN = 'test_token_12345';
process.env.HARVEST_ACCOUNT_ID = '123456';

import { z } from 'zod';
import { 
  HarvestAPIError, 
  ValidationError, 
  MCPToolError,
  handleValidationError,
  handleHarvestAPIError,
  handleMCPToolError
} from '../../../src/utils/errors';

describe('Error Classes', () => {
  describe('HarvestAPIError', () => {
    it('should create error with message and status', () => {
      const error = new HarvestAPIError('API Error', 404, 'not_found', { error: 'not_found' });
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('HarvestAPIError');
      expect(error.message).toBe('API Error');
      expect(error.status).toBe(404);
      expect(error.response).toEqual({ error: 'not_found' });
    });

    it('should have undefined status when not provided', () => {
      const error = new HarvestAPIError('Server Error');
      expect(error.status).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('should create error with validation context', () => {
      const zodError = new z.ZodError([{
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['name'],
        message: 'Expected string, received number'
      }]);

      const error = new ValidationError('Validation failed', zodError);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
      expect(error.errors).toBe(zodError);
    });
  });

  describe('MCPToolError', () => {
    it('should create error with tool context', () => {
      const originalError = new Error('Original error');
      const error = new MCPToolError('Tool failed', 'test_tool', originalError);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('MCPToolError');
      expect(error.message).toBe('Tool failed');
      expect(error.toolName).toBe('test_tool');
      expect(error.originalError).toBe(originalError);
    });

    it('should work without original error', () => {
      const error = new MCPToolError('Tool failed', 'test_tool');
      
      expect(error.toolName).toBe('test_tool');
      expect(error.originalError).toBeUndefined();
    });
  });
});

describe('Error Handlers', () => {
  describe('handleValidationError', () => {
    it('should throw ValidationError for ZodError', () => {
      const zodError = new z.ZodError([{
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['name'],
        message: 'Expected string, received number'
      }]);

      expect(() => {
        handleValidationError(zodError, 'test context');
      }).toThrow(ValidationError);

      expect(() => {
        handleValidationError(zodError, 'test context');
      }).toThrow('Invalid parameters: name: Expected string, received number');
    });

    it('should handle multiple validation errors', () => {
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number'
        },
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          path: ['email'],
          message: 'String must contain at least 1 character(s)'
        }
      ]);

      expect(() => {
        handleValidationError(zodError, 'test context');
      }).toThrow('Invalid parameters: name: Expected string, received number, email: String must contain at least 1 character(s)');
    });

    it('should handle nested path validation errors', () => {
      const zodError = new z.ZodError([{
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['user', 'profile', 'name'],
        message: 'Expected string, received number'
      }]);

      expect(() => {
        handleValidationError(zodError, 'nested test');
      }).toThrow('Invalid parameters: user.profile.name: Expected string, received number');
    });
  });

  describe('handleHarvestAPIError', () => {
    it('should throw HarvestAPIError for axios error with response', () => {
      const axiosError = {
        response: {
          status: 404,
          data: { error: 'not_found', error_description: 'Resource not found' }
        },
        config: { url: '/test' },
        message: 'Request failed with status code 404'
      };

      expect(() => {
        handleHarvestAPIError(axiosError);
      }).toThrow(HarvestAPIError);

      expect(() => {
        handleHarvestAPIError(axiosError);
      }).toThrow('Resource not found');
    });

    it('should throw HarvestAPIError for network error', () => {
      const networkError = {
        message: 'Network Error',
        code: 'ECONNREFUSED',
        request: {}
      };

      expect(() => {
        handleHarvestAPIError(networkError);
      }).toThrow(HarvestAPIError);

      expect(() => {
        handleHarvestAPIError(networkError);
      }).toThrow('Network error: Network Error');
    });

    it('should throw HarvestAPIError for unknown error', () => {
      const unknownError = 'String error';

      expect(() => {
        handleHarvestAPIError(unknownError);
      }).toThrow(HarvestAPIError);

      expect(() => {
        handleHarvestAPIError(unknownError);
      }).toThrow('Request error:');
    });
  });

  describe('handleMCPToolError', () => {
    it('should return error response and never throw', () => {
      const originalError = new Error('Test error');

      const result = handleMCPToolError(originalError, 'test_tool');
      
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Error: Failed to execute test_tool: Test error'
        }],
        isError: true
      });
    });

    it('should handle ValidationError correctly', () => {
      const zodError = new z.ZodError([{
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['name'],
        message: 'Expected string, received number'
      }]);
      const validationError = new ValidationError('Validation failed', zodError);

      const result = handleMCPToolError(validationError, 'test_tool');
      
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Error: Validation failed'
        }],
        isError: true
      });
    });

    it('should handle HarvestAPIError correctly', () => {
      const apiError = new HarvestAPIError('API Error', 500);

      const result = handleMCPToolError(apiError, 'test_tool');
      
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Error: API Error'
        }],
        isError: true
      });
    });

    it('should handle unknown error types', () => {
      const unknownError = 'String error';

      const result1 = handleMCPToolError(unknownError, 'test_tool');
      expect(result1).toEqual({
        content: [{
          type: 'text',
          text: 'Error: Failed to execute test_tool: Unknown error'
        }],
        isError: true
      });

      const originalError = new Error('Test error');
      const result2 = handleMCPToolError(originalError, 'test_tool');
      expect(result2).toEqual({
        content: [{
          type: 'text',
          text: 'Error: Failed to execute test_tool: Test error'
        }],
        isError: true
      });
    });
  });
});