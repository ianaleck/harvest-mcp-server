import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolResult,
  Tool,
} from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { appConfig, HarvestConfig } from './config/index';
import { createLogger } from './utils/logger';
import { HarvestAPIClient } from './client/harvest-api';
import {
  TimeEntryQuerySchema,
  CreateTimeEntrySchema,
  UpdateTimeEntrySchema,
  StartTimerSchema,
  StopTimerSchema,
  RestartTimerSchema,
} from './schemas/time-entry';

const logger = createLogger('server');

export interface HarvestMCPServerOptions {
  harvest: {
    accessToken: string;
    accountId: string;
  };
}

export class HarvestMCPServer {
  private server: Server;
  public harvestClient: HarvestAPIClient; // Make public for testing
  private tools: Map<string, Tool> = new Map();

  constructor(options?: HarvestMCPServerOptions) {
    // Use provided options or fall back to config
    const harvestConfig = options?.harvest || {
      accessToken: appConfig.harvest.accessToken,
      accountId: appConfig.harvest.accountId,
    };

    this.server = new Server(
      {
        name: 'harvest-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.harvestClient = new HarvestAPIClient(harvestConfig);
    this.registerToolHandlers();
    this.registerCompanyTools();
    this.registerTimeEntryTools();
  }

  private registerToolHandlers() {
    // Register list_tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()),
      };
    });

    // Register call_tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = this.tools.get(name);
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      try {
        return await this.executeTool(name, args || {});
      } catch (error) {
        logger.error(`Tool execution failed for ${name}:`, error);
        throw error;
      }
    });
  }

  private async executeTool(name: string, args: Record<string, any>): Promise<CallToolResult> {
    switch (name) {
      case 'get_company':
        return await this.getCompany(args);
      case 'list_time_entries':
        return await this.listTimeEntries(args);
      case 'get_time_entry':
        return await this.getTimeEntry(args);
      case 'create_time_entry':
        return await this.createTimeEntry(args);
      case 'update_time_entry':
        return await this.updateTimeEntry(args);
      case 'delete_time_entry':
        return await this.deleteTimeEntry(args);
      case 'start_timer':
        return await this.startTimer(args);
      case 'stop_timer':
        return await this.stopTimer(args);
      case 'restart_timer':
        return await this.restartTimer(args);
      default:
        throw new Error(`Tool not implemented: ${name}`);
    }
  }

  private registerCompanyTools() {
    // Register get_company tool
    this.tools.set('get_company', {
      name: 'get_company',
      description: 'Retrieve company information and settings for the authenticated account. Returns comprehensive company details including billing configuration, time tracking preferences, and enabled features.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    });
  }

  private async getCompany(_args: Record<string, any>): Promise<CallToolResult> {
    try {
      logger.info('Fetching company information from Harvest API');
      const company = await this.harvestClient.getCompany();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(company, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Failed to fetch company information:', error);
      throw new Error(`Failed to retrieve company information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  public async listTools(): Promise<Tool[]> {
    return Array.from(this.tools.values());
  }

  public async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Harvest MCP Server running on stdio transport');
  }

  private registerTimeEntryTools() {
    // Register list_time_entries tool
    this.tools.set('list_time_entries', {
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
    });

    // Register get_time_entry tool
    this.tools.set('get_time_entry', {
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
    });

    // Register create_time_entry tool
    this.tools.set('create_time_entry', {
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
    });

    // Register update_time_entry tool
    this.tools.set('update_time_entry', {
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
    });

    // Register delete_time_entry tool
    this.tools.set('delete_time_entry', {
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
    });

    // Register start_timer tool
    this.tools.set('start_timer', {
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
    });

    // Register stop_timer tool
    this.tools.set('stop_timer', {
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
    });

    // Register restart_timer tool
    this.tools.set('restart_timer', {
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
    });
  }

  private async listTimeEntries(args: Record<string, any>): Promise<CallToolResult> {
    try {
      // Validate input with Zod schema
      const validatedArgs = TimeEntryQuerySchema.parse(args);
      logger.info('Listing time entries from Harvest API');
      const timeEntries = await this.harvestClient.getTimeEntries(validatedArgs);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(timeEntries, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid time entries query parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to list time entries:', error);
      throw new Error(`Failed to retrieve time entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getTimeEntry(args: Record<string, any>): Promise<CallToolResult> {
    try {
      // Validate input
      const inputSchema = z.object({
        time_entry_id: z.number().int().positive(),
      });
      const { time_entry_id } = inputSchema.parse(args);

      logger.info('Fetching time entry from Harvest API', { timeEntryId: time_entry_id });
      const timeEntry = await this.harvestClient.getTimeEntry(time_entry_id);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(timeEntry, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid time entry parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to fetch time entry:', error);
      throw new Error(`Failed to retrieve time entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createTimeEntry(args: Record<string, any>): Promise<CallToolResult> {
    try {
      // Validate input with Zod schema
      const validatedArgs = CreateTimeEntrySchema.parse(args);
      logger.info('Creating time entry via Harvest API');
      const timeEntry = await this.harvestClient.createTimeEntry(validatedArgs);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(timeEntry, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid create time entry parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to create time entry:', error);
      throw new Error(`Failed to create time entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateTimeEntry(args: Record<string, any>): Promise<CallToolResult> {
    try {
      // Validate input with Zod schema
      const validatedArgs = UpdateTimeEntrySchema.parse(args);
      logger.info('Updating time entry via Harvest API', { timeEntryId: validatedArgs.id });
      const timeEntry = await this.harvestClient.updateTimeEntry(validatedArgs);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(timeEntry, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid update time entry parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to update time entry:', error);
      throw new Error(`Failed to update time entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async deleteTimeEntry(args: Record<string, any>): Promise<CallToolResult> {
    try {
      // Validate input
      const inputSchema = z.object({
        time_entry_id: z.number().int().positive(),
      });
      const { time_entry_id } = inputSchema.parse(args);

      logger.info('Deleting time entry via Harvest API', { timeEntryId: time_entry_id });
      await this.harvestClient.deleteTimeEntry(time_entry_id);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ message: `Time entry ${time_entry_id} deleted successfully` }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid delete time entry parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to delete time entry:', error);
      throw new Error(`Failed to delete time entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async startTimer(args: Record<string, any>): Promise<CallToolResult> {
    try {
      // Validate input with Zod schema
      const validatedArgs = StartTimerSchema.parse(args);
      logger.info('Starting timer via Harvest API');
      const timeEntry = await this.harvestClient.startTimer(validatedArgs);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(timeEntry, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid start timer parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to start timer:', error);
      throw new Error(`Failed to start timer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async stopTimer(args: Record<string, any>): Promise<CallToolResult> {
    try {
      // Validate input with Zod schema
      const validatedArgs = StopTimerSchema.parse(args);
      logger.info('Stopping timer via Harvest API', { timeEntryId: validatedArgs.id });
      const timeEntry = await this.harvestClient.stopTimer(validatedArgs);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(timeEntry, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid stop timer parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to stop timer:', error);
      throw new Error(`Failed to stop timer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async restartTimer(args: Record<string, any>): Promise<CallToolResult> {
    try {
      // Validate input with Zod schema
      const validatedArgs = RestartTimerSchema.parse(args);
      logger.info('Restarting timer via Harvest API', { timeEntryId: validatedArgs.id });
      const timeEntry = await this.harvestClient.restartTimer(validatedArgs);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(timeEntry, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid restart timer parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to restart timer:', error);
      throw new Error(`Failed to restart timer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public getToolsByCategory(category: string): any[] {
    const categoryTools = Array.from(this.tools.values()).filter(tool => {
      if (category === 'company') {
        return tool.name.includes('company') || tool.name === 'get_company';
      }
      if (category === 'time_entries') {
        return tool.name.includes('time_entry') || tool.name.includes('time_entries') || tool.name.includes('timer');
      }
      return false;
    });
    
    return categoryTools.map(tool => ({
      ...tool,
      execute: async (args: Record<string, any>) => {
        const result = await this.executeTool(tool.name, args);
        return {
          content: JSON.parse(result.content[0].text as string),
        };
      },
      httpClient: this.harvestClient,
    }));
  }

  public async close() {
    if (this.harvestClient) {
      await this.harvestClient.close?.();
    }
  }
}