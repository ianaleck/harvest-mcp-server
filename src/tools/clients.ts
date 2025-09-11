/**
 * Client Tools for Harvest MCP Server
 * Handles client management and relationship operations
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createLogger } from '../utils/logger';
import { handleMCPToolError } from '../utils/errors';
import { validateInput } from '../utils/validation';
import { BaseToolConfig, ToolHandler, ToolRegistration } from '../types';
import { 
  ClientQuerySchema,
  CreateClientSchema,
  UpdateClientSchema
} from '../schemas/client';

const logger = createLogger('client-tools');

class ListClientsHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(ClientQuerySchema, args, 'client query');
      logger.info('Listing clients from Harvest API');
      const clients = await this.config.harvestClient.getClients(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(clients, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'list_clients');
    }
  }
}

class GetClientHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ client_id: z.number().int().positive() });
      const { client_id } = validateInput(inputSchema, args, 'get client');
      
      logger.info('Fetching client from Harvest API', { clientId: client_id });
      const client = await this.config.harvestClient.getClient(client_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(client, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'get_client');
    }
  }
}

class CreateClientHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(CreateClientSchema, args, 'create client');
      logger.info('Creating client via Harvest API');
      const client = await this.config.harvestClient.createClient(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(client, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'create_client');
    }
  }
}

class UpdateClientHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(UpdateClientSchema, args, 'update client');
      logger.info('Updating client via Harvest API', { clientId: validatedArgs.id });
      const client = await this.config.harvestClient.updateClient(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(client, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'update_client');
    }
  }
}

class DeleteClientHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ client_id: z.number().int().positive() });
      const { client_id } = validateInput(inputSchema, args, 'delete client');
      
      logger.info('Deleting client via Harvest API', { clientId: client_id });
      await this.config.harvestClient.deleteClient(client_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify({ message: `Client ${client_id} deleted successfully` }, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'delete_client');
    }
  }
}

export function registerClientTools(config: BaseToolConfig): ToolRegistration[] {
  return [
    {
      tool: {
        name: 'list_clients',
        description: 'Retrieve a list of clients with optional filtering by active status and updated date. Returns paginated results with client details including billing information.',
        inputSchema: {
          type: 'object',
          properties: {
            is_active: { type: 'boolean', description: 'Filter by active status' },
            updated_since: { type: 'string', format: 'date-time', description: 'Filter by clients updated since this timestamp' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            per_page: { type: 'number', minimum: 1, maximum: 2000, description: 'Number of clients per page (max 2000)' },
          },
          additionalProperties: false,
        },
      },
      handler: new ListClientsHandler(config),
    },
    {
      tool: {
        name: 'get_client',
        description: 'Retrieve a specific client by its ID. Returns complete client details including contact information and billing configuration.',
        inputSchema: {
          type: 'object',
          properties: {
            client_id: { type: 'number', description: 'The ID of the client to retrieve' },
          },
          required: ['client_id'],
          additionalProperties: false,
        },
      },
      handler: new GetClientHandler(config),
    },
    {
      tool: {
        name: 'create_client',
        description: 'Create a new client for project management and billing. Requires client name and supports address and currency configuration.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, description: 'Client name (required)' },
            is_active: { type: 'boolean', description: 'Whether the client is active' },
            address: { type: 'string', description: 'Client address' },
            currency: { type: 'string', minLength: 3, maxLength: 3, description: '3-letter ISO currency code (e.g., USD, EUR)' },
          },
          required: ['name'],
          additionalProperties: false,
        },
      },
      handler: new CreateClientHandler(config),
    },
    {
      tool: {
        name: 'update_client',
        description: 'Update an existing client. Can modify name, active status, address, and currency. Only provided fields will be updated.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The ID of the client to update (required)' },
            name: { type: 'string', minLength: 1, description: 'Update client name' },
            is_active: { type: 'boolean', description: 'Update active status' },
            address: { type: 'string', description: 'Update client address' },
            currency: { type: 'string', minLength: 3, maxLength: 3, description: 'Update currency code' },
          },
          required: ['id'],
          additionalProperties: false,
        },
      },
      handler: new UpdateClientHandler(config),
    },
    {
      tool: {
        name: 'delete_client',
        description: 'Delete (archive) a client. This action archives the client rather than permanently deleting it, preserving historical project and billing data.',
        inputSchema: {
          type: 'object',
          properties: {
            client_id: { type: 'number', description: 'The ID of the client to delete' },
          },
          required: ['client_id'],
          additionalProperties: false,
        },
      },
      handler: new DeleteClientHandler(config),
    },
  ];
}