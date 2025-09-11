/**
 * Time Entry Tools for Harvest MCP Server
 * Handles time tracking, timer operations, and time entry management
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createLogger } from '../utils/logger';
import { handleMCPToolError } from '../utils/errors';
import { validateInput } from '../utils/validation';
import { BaseToolConfig, ToolHandler, ToolRegistration } from '../types';
import { 
  TimeEntryQuerySchema,
  CreateTimeEntrySchema,
  UpdateTimeEntrySchema,
  StartTimerSchema,
  StopTimerSchema,
  RestartTimerSchema,
} from '../schemas/time-entry';

const logger = createLogger('time-entry-tools');

class ListTimeEntriesHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(TimeEntryQuerySchema, args, 'time entries query');
      logger.info('Listing time entries from Harvest API');
      const timeEntries = await this.config.harvestClient.getTimeEntries(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(timeEntries, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'list_time_entries');
    }
  }
}

class GetTimeEntryHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ time_entry_id: z.number().int().positive() });
      const { time_entry_id } = validateInput(inputSchema, args, 'get time entry');

      logger.info('Fetching time entry from Harvest API', { timeEntryId: time_entry_id });
      const timeEntry = await this.config.harvestClient.getTimeEntry(time_entry_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(timeEntry, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'get_time_entry');
    }
  }
}

class CreateTimeEntryHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(CreateTimeEntrySchema, args, 'create time entry');
      logger.info('Creating time entry via Harvest API');
      const timeEntry = await this.config.harvestClient.createTimeEntry(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(timeEntry, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'create_time_entry');
    }
  }
}

class UpdateTimeEntryHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(UpdateTimeEntrySchema, args, 'update time entry');
      logger.info('Updating time entry via Harvest API', { timeEntryId: validatedArgs.id });
      const timeEntry = await this.config.harvestClient.updateTimeEntry(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(timeEntry, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'update_time_entry');
    }
  }
}

class DeleteTimeEntryHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ time_entry_id: z.number().int().positive() });
      const { time_entry_id } = validateInput(inputSchema, args, 'delete time entry');

      logger.info('Deleting time entry via Harvest API', { timeEntryId: time_entry_id });
      await this.config.harvestClient.deleteTimeEntry(time_entry_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify({ message: `Time entry ${time_entry_id} deleted successfully` }, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'delete_time_entry');
    }
  }
}

class StartTimerHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(StartTimerSchema, args, 'start timer');
      logger.info('Starting timer via Harvest API');
      const timeEntry = await this.config.harvestClient.startTimer(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(timeEntry, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'start_timer');
    }
  }
}

class StopTimerHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(StopTimerSchema, args, 'stop timer');
      logger.info('Stopping timer via Harvest API', { timeEntryId: validatedArgs.id });
      const timeEntry = await this.config.harvestClient.stopTimer(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(timeEntry, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'stop_timer');
    }
  }
}

class RestartTimerHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(RestartTimerSchema, args, 'restart timer');
      logger.info('Restarting timer via Harvest API', { timeEntryId: validatedArgs.id });
      const timeEntry = await this.config.harvestClient.restartTimer(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(timeEntry, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'restart_timer');
    }
  }
}

export function registerTimeEntryTools(config: BaseToolConfig): ToolRegistration[] {
  return [
    {
      tool: {
        name: 'list_time_entries',
        description: 'Retrieve a list of time entries with optional filtering. Supports filtering by user, client, project, task, billing status, date ranges, and more. Returns paginated results.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: { type: 'number', description: 'Filter by user ID' },
            client_id: { type: 'number', description: 'Filter by client ID' },
            project_id: { type: 'number', description: 'Filter by project ID' },
            task_id: { type: 'number', description: 'Filter by task ID' },
            is_billed: { type: 'boolean', description: 'Filter by billing status' },
            is_running: { type: 'boolean', description: 'Filter by running timer status' },
            updated_since: { type: 'string', format: 'date-time', description: 'Filter by entries updated since this timestamp' },
            from: { type: 'string', format: 'date', description: 'Start date for date range filter (YYYY-MM-DD)' },
            to: { type: 'string', format: 'date', description: 'End date for date range filter (YYYY-MM-DD)' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            per_page: { type: 'number', minimum: 1, maximum: 2000, description: 'Number of entries per page (max 2000)' },
          },
          additionalProperties: false,
        },
      },
      handler: new ListTimeEntriesHandler(config),
    },
    {
      tool: {
        name: 'get_time_entry',
        description: 'Retrieve a specific time entry by its ID. Returns complete time entry details including project, task, user, and timing information.',
        inputSchema: {
          type: 'object',
          properties: {
            time_entry_id: { type: 'number', description: 'The ID of the time entry to retrieve' },
          },
          required: ['time_entry_id'],
          additionalProperties: false,
        },
      },
      handler: new GetTimeEntryHandler(config),
    },
    {
      tool: {
        name: 'create_time_entry',
        description: 'Create a new time entry. Requires project_id, task_id, and spent_date. Must provide either hours OR both started_time and ended_time.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'number', description: 'The project ID to log time against' },
            task_id: { type: 'number', description: 'The task ID to log time against' },
            spent_date: { type: 'string', format: 'date', description: 'The date the time was spent (YYYY-MM-DD)' },
            started_time: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', description: 'Start time in HH:MM format (24-hour)' },
            ended_time: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', description: 'End time in HH:MM format (24-hour)' },
            hours: { type: 'number', minimum: 0, maximum: 24, description: 'Decimal hours (e.g., 0.5 = 30min, 1.25 = 1h15m)' },
            notes: { type: 'string', maxLength: 2000, description: 'Notes for the time entry' },
            external_reference: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'External reference ID' },
                group_id: { type: 'string', description: 'External group ID' },
                account_id: { type: 'string', description: 'External account ID' },
                permalink: { type: 'string', format: 'uri', description: 'External permalink URL' },
              },
              additionalProperties: false,
            },
          },
          required: ['project_id', 'task_id', 'spent_date'],
          additionalProperties: false,
        },
      },
      handler: new CreateTimeEntryHandler(config),
    },
    {
      tool: {
        name: 'update_time_entry',
        description: 'Update an existing time entry. Can modify project, task, hours, notes, and other fields. Only provided fields will be updated.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The ID of the time entry to update' },
            project_id: { type: 'number', description: 'Update the project ID' },
            task_id: { type: 'number', description: 'Update the task ID' },
            spent_date: { type: 'string', format: 'date', description: 'Update the spent date (YYYY-MM-DD)' },
            started_time: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', description: 'Update start time in HH:MM format' },
            ended_time: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', description: 'Update end time in HH:MM format' },
            hours: { type: 'number', minimum: 0, maximum: 24, description: 'Update decimal hours' },
            notes: { type: 'string', maxLength: 2000, description: 'Update notes' },
            external_reference: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                group_id: { type: 'string' },
                account_id: { type: 'string' },
                permalink: { type: 'string', format: 'uri' },
              },
              additionalProperties: false,
            },
          },
          required: ['id'],
          additionalProperties: false,
        },
      },
      handler: new UpdateTimeEntryHandler(config),
    },
    {
      tool: {
        name: 'delete_time_entry',
        description: 'Delete a time entry permanently. This action cannot be undone.',
        inputSchema: {
          type: 'object',
          properties: {
            time_entry_id: { type: 'number', description: 'The ID of the time entry to delete' },
          },
          required: ['time_entry_id'],
          additionalProperties: false,
        },
      },
      handler: new DeleteTimeEntryHandler(config),
    },
    {
      tool: {
        name: 'start_timer',
        description: 'Start a timer for a new time entry. Creates a running time entry that tracks time automatically.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'number', description: 'The project ID to start the timer for' },
            task_id: { type: 'number', description: 'The task ID to start the timer for' },
            spent_date: { type: 'string', format: 'date', description: 'Date for the timer (defaults to today)' },
            notes: { type: 'string', maxLength: 2000, description: 'Initial notes for the timer' },
            external_reference: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                group_id: { type: 'string' },
                account_id: { type: 'string' },
                permalink: { type: 'string', format: 'uri' },
              },
              additionalProperties: false,
            },
          },
          required: ['project_id', 'task_id'],
          additionalProperties: false,
        },
      },
      handler: new StartTimerHandler(config),
    },
    {
      tool: {
        name: 'stop_timer',
        description: 'Stop a running timer and finalize the time entry with calculated hours.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The ID of the running time entry to stop' },
          },
          required: ['id'],
          additionalProperties: false,
        },
      },
      handler: new StopTimerHandler(config),
    },
    {
      tool: {
        name: 'restart_timer',
        description: 'Restart a previously stopped timer, creating a new running time entry based on an existing entry.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The ID of the time entry to restart the timer for' },
          },
          required: ['id'],
          additionalProperties: false,
        },
      },
      handler: new RestartTimerHandler(config),
    },
  ];
}