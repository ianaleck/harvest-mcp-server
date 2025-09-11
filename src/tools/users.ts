/**
 * User Tools for Harvest MCP Server
 * Handles user management, authentication, and permission operations
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createLogger } from '../utils/logger';
import { handleMCPToolError } from '../utils/errors';
import { validateInput } from '../utils/validation';
import { BaseToolConfig, ToolHandler, ToolRegistration } from '../types';
import { 
  UserQuerySchema,
  CreateUserSchema,
  UpdateUserSchema
} from '../schemas/user';

const logger = createLogger('user-tools');

class ListUsersHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(UserQuerySchema, args, 'users query');
      logger.info('Listing users from Harvest API');
      const users = await this.config.harvestClient.getUsers(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(users, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'list_users');
    }
  }
}

class GetUserHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ user_id: z.number().int().positive() });
      const { user_id } = validateInput(inputSchema, args, 'get user');
      
      logger.info('Fetching user from Harvest API', { userId: user_id });
      const user = await this.config.harvestClient.getUser(user_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(user, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'get_user');
    }
  }
}

class GetCurrentUserHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      logger.info('Fetching current user from Harvest API');
      const user = await this.config.harvestClient.getCurrentUser();
      
      return {
        content: [{ type: 'text', text: JSON.stringify(user, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'get_current_user');
    }
  }
}

class CreateUserHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(CreateUserSchema, args, 'create user');
      logger.info('Creating user via Harvest API');
      const user = await this.config.harvestClient.createUser(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(user, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'create_user');
    }
  }
}

class UpdateUserHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(UpdateUserSchema, args, 'update user');
      logger.info('Updating user via Harvest API', { userId: validatedArgs.id });
      const user = await this.config.harvestClient.updateUser(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(user, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'update_user');
    }
  }
}

class DeleteUserHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ user_id: z.number().int().positive() });
      const { user_id } = validateInput(inputSchema, args, 'delete user');
      
      logger.info('Deleting user via Harvest API', { userId: user_id });
      await this.config.harvestClient.deleteUser(user_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify({ message: `User ${user_id} deleted successfully` }, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'delete_user');
    }
  }
}

export function registerUserTools(config: BaseToolConfig): ToolRegistration[] {
  return [
    {
      tool: {
        name: 'list_users',
        description: 'Retrieve a list of users with optional filtering by active status and updated date. Returns paginated results with user profiles and permissions.',
        inputSchema: {
          type: 'object',
          properties: {
            is_active: { type: 'boolean', description: 'Filter by active status' },
            updated_since: { type: 'string', format: 'date-time', description: 'Filter by users updated since this timestamp' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            per_page: { type: 'number', minimum: 1, maximum: 2000, description: 'Number of users per page (max 2000)' },
          },
          additionalProperties: false,
        },
      },
      handler: new ListUsersHandler(config),
    },
    {
      tool: {
        name: 'get_user',
        description: 'Retrieve a specific user by ID. Returns complete user profile including roles, permissions, and billing rates.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: { type: 'number', description: 'The ID of the user to retrieve' },
          },
          required: ['user_id'],
          additionalProperties: false,
        },
      },
      handler: new GetUserHandler(config),
    },
    {
      tool: {
        name: 'get_current_user',
        description: 'Retrieve the currently authenticated user\'s profile and permissions.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      handler: new GetCurrentUserHandler(config),
    },
    {
      tool: {
        name: 'create_user',
        description: 'Create a new user with specified roles and permissions. Supports team member management and access control.',
        inputSchema: {
          type: 'object',
          properties: {
            first_name: { type: 'string', minLength: 1, description: 'First name (required)' },
            last_name: { type: 'string', minLength: 1, description: 'Last name (required)' },
            email: { type: 'string', format: 'email', description: 'Email address (required)' },
            telephone: { type: 'string', description: 'Phone number' },
            timezone: { type: 'string', description: 'User timezone' },
            has_access_to_all_future_projects: { type: 'boolean', description: 'Grant access to all future projects' },
            is_contractor: { type: 'boolean', description: 'Mark as contractor' },
            is_admin: { type: 'boolean', description: 'Grant admin privileges' },
            is_project_manager: { type: 'boolean', description: 'Grant project manager role' },
            can_see_rates: { type: 'boolean', description: 'Allow viewing of billing rates' },
            can_create_projects: { type: 'boolean', description: 'Allow project creation' },
            can_create_invoices: { type: 'boolean', description: 'Allow invoice creation' },
            is_active: { type: 'boolean', description: 'User active status' },
            weekly_capacity: { type: 'number', minimum: 0, description: 'Weekly capacity in seconds' },
            default_hourly_rate: { type: 'number', minimum: 0, description: 'Default hourly rate' },
            cost_rate: { type: 'number', minimum: 0, description: 'Cost rate for internal calculations' },
          },
          required: ['first_name', 'last_name', 'email'],
          additionalProperties: false,
        },
      },
      handler: new CreateUserHandler(config),
    },
    {
      tool: {
        name: 'update_user',
        description: 'Update an existing user\'s profile, permissions, and rates. Only provided fields will be updated.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The ID of the user to update (required)' },
            first_name: { type: 'string', minLength: 1, description: 'Update first name' },
            last_name: { type: 'string', minLength: 1, description: 'Update last name' },
            email: { type: 'string', format: 'email', description: 'Update email address' },
            telephone: { type: 'string', description: 'Update phone number' },
            timezone: { type: 'string', description: 'Update timezone' },
            has_access_to_all_future_projects: { type: 'boolean', description: 'Update future project access' },
            is_contractor: { type: 'boolean', description: 'Update contractor status' },
            is_admin: { type: 'boolean', description: 'Update admin privileges' },
            is_project_manager: { type: 'boolean', description: 'Update project manager role' },
            can_see_rates: { type: 'boolean', description: 'Update rate visibility' },
            can_create_projects: { type: 'boolean', description: 'Update project creation permission' },
            can_create_invoices: { type: 'boolean', description: 'Update invoice creation permission' },
            is_active: { type: 'boolean', description: 'Update active status' },
            weekly_capacity: { type: 'number', minimum: 0, description: 'Update weekly capacity' },
            default_hourly_rate: { type: 'number', minimum: 0, description: 'Update default hourly rate' },
            cost_rate: { type: 'number', minimum: 0, description: 'Update cost rate' },
          },
          required: ['id'],
          additionalProperties: false,
        },
      },
      handler: new UpdateUserHandler(config),
    },
    {
      tool: {
        name: 'delete_user',
        description: 'Delete (archive) a user. This action archives the user rather than permanently deleting them, preserving time tracking history.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: { type: 'number', description: 'The ID of the user to delete' },
          },
          required: ['user_id'],
          additionalProperties: false,
        },
      },
      handler: new DeleteUserHandler(config),
    },
  ];
}