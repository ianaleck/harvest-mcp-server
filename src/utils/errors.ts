/**
 * Error handling utilities for Harvest MCP Server
 * Provides structured error types and handling functions
 */

import { z } from 'zod';
import { createLogger } from './logger';

const logger = createLogger('errors');

export class HarvestAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public response?: any
  ) {
    super(message);
    this.name = 'HarvestAPIError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public errors: z.ZodError) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class MCPToolError extends Error {
  constructor(
    message: string,
    public toolName: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'MCPToolError';
  }
}

export function handleHarvestAPIError(error: any): never {
  if (error.response) {
    const status = error.response.status;
    const statusText = error.response.statusText;
    
    logger.error(`HTTP ${status} ${statusText} from ${error.config?.url}:`, {
      status,
      statusText,
      data: error.response.data
    });

    switch (status) {
      case 401:
        throw new HarvestAPIError('Authentication failed: Invalid access token or account ID', status, 'auth_error');
      case 403:
        throw new HarvestAPIError('Access forbidden: Insufficient permissions', status, 'permission_error');
      case 404:
        throw new HarvestAPIError('Resource not found', status, 'not_found');
      case 429:
        const retryAfter = error.response.headers['retry-after'];
        throw new HarvestAPIError(`Rate limit exceeded. Retry after ${retryAfter || 'unknown'} seconds`, status, 'rate_limit');
      case 422:
        throw new HarvestAPIError('Validation failed: ' + JSON.stringify(error.response.data), status, 'validation_error');
      case 500:
      case 502:
      case 503:
      case 504:
        throw new HarvestAPIError(`Server error (${status}): Please try again later`, status, 'server_error');
      default:
        throw new HarvestAPIError(`HTTP ${status}: ${statusText}`, status, 'unknown_error');
    }
  } else if (error.request) {
    logger.error('Network error:', error.message);
    throw new HarvestAPIError(`Network error: ${error.message}`, undefined, 'network_error');
  } else {
    logger.error('Request setup error:', error.message);
    throw new HarvestAPIError(`Request error: ${error.message}`, undefined, 'request_error');
  }
}

export function handleValidationError(error: z.ZodError, context: string): never {
  logger.error(`Validation failed for ${context}:`, error.errors);
  const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
  throw new ValidationError(
    `Invalid parameters: ${errorMessages.join(', ')}`,
    error
  );
}

export function handleMCPToolError(error: any, toolName: string): never {
  if (error instanceof HarvestAPIError || error instanceof ValidationError) {
    throw error;
  }
  
  logger.error(`Tool execution failed for ${toolName}:`, error);
  throw new MCPToolError(
    `Failed to execute ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    toolName,
    error instanceof Error ? error : undefined
  );
}