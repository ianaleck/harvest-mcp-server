/**
 * Estimate Tools for Harvest MCP Server
 * Handles estimate creation, management, and client proposal operations
 */

import { CallToolResult } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { createLogger } from '../utils/logger';
import { handleMCPToolError } from '../utils/errors';
import { validateInput } from '../utils/validation';
import { BaseToolConfig, ToolHandler, ToolRegistration } from '../types';
import { 
  EstimateQuerySchema,
  CreateEstimateSchema,
  UpdateEstimateSchema,
} from '../schemas/estimate';

const logger = createLogger('estimate-tools');

class ListEstimatesHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(EstimateQuerySchema, args, 'estimate query');
      logger.info('Listing estimates from Harvest API');
      const estimates = await this.config.harvestClient.getEstimates(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(estimates, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'list_estimates');
    }
  }
}

class GetEstimateHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ estimate_id: z.number().int().positive() });
      const { estimate_id } = validateInput(inputSchema, args, 'get estimate');
      
      logger.info('Fetching estimate from Harvest API', { estimateId: estimate_id });
      const estimate = await this.config.harvestClient.getEstimate(estimate_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(estimate, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'get_estimate');
    }
  }
}

class CreateEstimateHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(CreateEstimateSchema, args, 'create estimate');
      logger.info('Creating estimate via Harvest API');
      const estimate = await this.config.harvestClient.createEstimate(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(estimate, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'create_estimate');
    }
  }
}

class UpdateEstimateHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(UpdateEstimateSchema, args, 'update estimate');
      logger.info('Updating estimate via Harvest API', { estimateId: validatedArgs.id });
      const estimate = await this.config.harvestClient.updateEstimate(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(estimate, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'update_estimate');
    }
  }
}

class DeleteEstimateHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ estimate_id: z.number().int().positive() });
      const { estimate_id } = validateInput(inputSchema, args, 'delete estimate');
      
      logger.info('Deleting estimate via Harvest API', { estimateId: estimate_id });
      await this.config.harvestClient.deleteEstimate(estimate_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify({ message: `Estimate ${estimate_id} deleted successfully` }, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'delete_estimate');
    }
  }
}

export function registerEstimateTools(config: BaseToolConfig): ToolRegistration[] {
  return [
    {
      tool: {
        name: 'list_estimates',
        description: 'Retrieve estimates with filtering by client, state, and date ranges. Returns paginated results with estimate details.',
        inputSchema: {
          type: 'object',
          properties: {
            client_id: { type: 'number', description: 'Filter by client ID' },
            state: { type: 'string', enum: ['draft', 'sent', 'accepted', 'declined'], description: 'Filter by estimate state' },
            from: { type: 'string', format: 'date', description: 'Start date for date range filter (YYYY-MM-DD)' },
            to: { type: 'string', format: 'date', description: 'End date for date range filter (YYYY-MM-DD)' },
            updated_since: { type: 'string', format: 'date-time', description: 'Filter by estimates updated since this timestamp' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            per_page: { type: 'number', minimum: 1, maximum: 2000, description: 'Number of estimates per page (max 2000)' },
          },
          additionalProperties: false,
        },
      },
      handler: new ListEstimatesHandler(config),
    },
    {
      tool: {
        name: 'get_estimate',
        description: 'Retrieve a specific estimate by ID with complete details including line items, terms, and client information.',
        inputSchema: {
          type: 'object',
          properties: {
            estimate_id: { type: 'number', description: 'The ID of the estimate to retrieve' },
          },
          required: ['estimate_id'],
          additionalProperties: false,
        },
      },
      handler: new GetEstimateHandler(config),
    },
    {
      tool: {
        name: 'create_estimate',
        description: 'Create a new estimate for a client with optional line items and terms. Supports custom pricing, taxes, and discounts.',
        inputSchema: {
          type: 'object',
          properties: {
            client_id: { type: 'number', description: 'The client ID to create the estimate for (required)' },
            subject: { type: 'string', description: 'Estimate subject line' },
            notes: { type: 'string', description: 'Estimate notes or description' },
            currency: { type: 'string', minLength: 3, maxLength: 3, description: '3-letter ISO currency code (e.g., USD, EUR)' },
            issue_date: { type: 'string', format: 'date', description: 'Estimate issue date (YYYY-MM-DD)' },
            tax: { type: 'number', minimum: 0, maximum: 100, description: 'Tax percentage (0-100)' },
            tax2: { type: 'number', minimum: 0, maximum: 100, description: 'Second tax percentage (0-100)' },
            discount: { type: 'number', minimum: 0, maximum: 100, description: 'Discount percentage (0-100)' },
            purchase_order: { type: 'string', description: 'Client purchase order number' },
          },
          required: ['client_id'],
          additionalProperties: false,
        },
      },
      handler: new CreateEstimateHandler(config),
    },
    {
      tool: {
        name: 'update_estimate',
        description: 'Update an existing estimate including subject, terms, taxes, and other details. Only provided fields will be updated.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The ID of the estimate to update (required)' },
            client_id: { type: 'number', description: 'Update the client ID' },
            subject: { type: 'string', description: 'Update estimate subject' },
            notes: { type: 'string', description: 'Update estimate notes' },
            currency: { type: 'string', minLength: 3, maxLength: 3, description: 'Update currency code' },
            issue_date: { type: 'string', format: 'date', description: 'Update issue date' },
            tax: { type: 'number', minimum: 0, maximum: 100, description: 'Update tax percentage' },
            tax2: { type: 'number', minimum: 0, maximum: 100, description: 'Update second tax percentage' },
            discount: { type: 'number', minimum: 0, maximum: 100, description: 'Update discount percentage' },
            purchase_order: { type: 'string', description: 'Update purchase order number' },
          },
          required: ['id'],
          additionalProperties: false,
        },
      },
      handler: new UpdateEstimateHandler(config),
    },
    {
      tool: {
        name: 'delete_estimate',
        description: 'Delete an estimate permanently. This action cannot be undone.',
        inputSchema: {
          type: 'object',
          properties: {
            estimate_id: { type: 'number', description: 'The ID of the estimate to delete' },
          },
          required: ['estimate_id'],
          additionalProperties: false,
        },
      },
      handler: new DeleteEstimateHandler(config),
    },
  ];
}