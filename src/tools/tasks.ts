/**
 * Task Tools for Harvest MCP Server
 * Handles task management and task-to-project assignment operations
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createLogger } from '../utils/logger';
import { handleMCPToolError } from '../utils/errors';
import { validateInput } from '../utils/validation';
import { BaseToolConfig, ToolHandler, ToolRegistration } from '../types';
import { 
  TaskQuerySchema,
  CreateTaskSchema,
  UpdateTaskSchema
} from '../schemas/task';

const logger = createLogger('task-tools');

class ListTasksHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(TaskQuerySchema, args, 'tasks query');
      logger.info('Listing tasks from Harvest API');
      const tasks = await this.config.harvestClient.getTasks(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'list_tasks');
    }
  }
}

class GetTaskHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ task_id: z.number().int().positive() });
      const { task_id } = validateInput(inputSchema, args, 'get task');
      
      logger.info('Fetching task from Harvest API', { taskId: task_id });
      const task = await this.config.harvestClient.getTask(task_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'get_task');
    }
  }
}

class CreateTaskHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(CreateTaskSchema, args, 'create task');
      logger.info('Creating task via Harvest API');
      const task = await this.config.harvestClient.createTask(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'create_task');
    }
  }
}

class UpdateTaskHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(UpdateTaskSchema, args, 'update task');
      logger.info('Updating task via Harvest API', { taskId: validatedArgs.id });
      const task = await this.config.harvestClient.updateTask(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'update_task');
    }
  }
}

class DeleteTaskHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ task_id: z.number().int().positive() });
      const { task_id } = validateInput(inputSchema, args, 'delete task');
      
      logger.info('Deleting task via Harvest API', { taskId: task_id });
      await this.config.harvestClient.deleteTask(task_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify({ message: `Task ${task_id} deleted successfully` }, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'delete_task');
    }
  }
}

export function registerTaskTools(config: BaseToolConfig): ToolRegistration[] {
  return [
    {
      tool: {
        name: 'list_tasks',
        description: 'Retrieve a list of tasks with optional filtering. Tasks are the building blocks for time tracking and can be assigned to projects.',
        inputSchema: {
          type: 'object',
          properties: {
            is_active: { type: 'boolean', description: 'Filter by active status' },
            updated_since: { type: 'string', format: 'date-time', description: 'Filter by tasks updated since this timestamp' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            per_page: { type: 'number', minimum: 1, maximum: 2000, description: 'Number of tasks per page (max 2000)' },
          },
          additionalProperties: false,
        },
      },
      handler: new ListTasksHandler(config),
    },
    {
      tool: {
        name: 'get_task',
        description: 'Retrieve a specific task by its ID. Returns complete task details including default billing settings and activity status.',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'number', description: 'The ID of the task to retrieve' },
          },
          required: ['task_id'],
          additionalProperties: false,
        },
      },
      handler: new GetTaskHandler(config),
    },
    {
      tool: {
        name: 'create_task',
        description: 'Create a new task that can be assigned to projects for time tracking. Tasks define what type of work is being performed.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, description: 'Task name (required)' },
            billable_by_default: { type: 'boolean', description: 'Whether this task is billable by default' },
            default_hourly_rate: { type: 'number', minimum: 0, description: 'Default hourly rate for this task' },
            is_default: { type: 'boolean', description: 'Whether this is a default task' },
            is_active: { type: 'boolean', description: 'Whether the task is active' },
          },
          required: ['name'],
          additionalProperties: false,
        },
      },
      handler: new CreateTaskHandler(config),
    },
    {
      tool: {
        name: 'update_task',
        description: 'Update an existing task. Can modify task name, billing settings, and activity status. Only provided fields will be updated.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The ID of the task to update (required)' },
            name: { type: 'string', minLength: 1, description: 'Update task name' },
            billable_by_default: { type: 'boolean', description: 'Update default billing status' },
            default_hourly_rate: { type: 'number', minimum: 0, description: 'Update default hourly rate' },
            is_default: { type: 'boolean', description: 'Update default task status' },
            is_active: { type: 'boolean', description: 'Update active status' },
          },
          required: ['id'],
          additionalProperties: false,
        },
      },
      handler: new UpdateTaskHandler(config),
    },
    {
      tool: {
        name: 'delete_task',
        description: 'Delete (archive) a task. This action archives the task rather than permanently deleting it, preserving historical data while making it inactive.',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'number', description: 'The ID of the task to delete' },
          },
          required: ['task_id'],
          additionalProperties: false,
        },
      },
      handler: new DeleteTaskHandler(config),
    },
  ];
}