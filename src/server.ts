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
import {
  ProjectQuerySchema,
  CreateProjectSchema,
  UpdateProjectSchema,
} from './schemas/project';
import {
  TaskQuerySchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  ProjectTaskAssignmentQuerySchema,
  CreateProjectTaskAssignmentSchema,
  UpdateProjectTaskAssignmentSchema,
} from './schemas/task';

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
    this.registerProjectTools();
    this.registerTaskTools();
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
      case 'list_projects':
        return await this.listProjects(args);
      case 'get_project':
        return await this.getProject(args);
      case 'create_project':
        return await this.createProject(args);
      case 'update_project':
        return await this.updateProject(args);
      case 'delete_project':
        return await this.deleteProject(args);
      case 'list_tasks':
        return await this.listTasks(args);
      case 'get_task':
        return await this.getTask(args);
      case 'create_task':
        return await this.createTask(args);
      case 'update_task':
        return await this.updateTask(args);
      case 'delete_task':
        return await this.deleteTask(args);
      case 'list_project_task_assignments':
        return await this.listProjectTaskAssignments(args);
      case 'create_project_task_assignment':
        return await this.createProjectTaskAssignment(args);
      case 'update_project_task_assignment':
        return await this.updateProjectTaskAssignment(args);
      case 'delete_project_task_assignment':
        return await this.deleteProjectTaskAssignment(args);
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

  private registerProjectTools() {
    // Register list_projects tool
    this.tools.set('list_projects', {
      name: 'list_projects',
      description: 'Retrieve a list of projects with optional filtering. Supports filtering by client, active status, and updated date. Returns paginated results with project details including budgets and billing information.',
      inputSchema: {
        type: 'object',
        properties: {
          is_active: { type: 'boolean', description: 'Filter by active status' },
          client_id: { type: 'number', description: 'Filter by client ID' },
          updated_since: { type: 'string', format: 'date-time', description: 'Filter by projects updated since this timestamp' },
          page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
          per_page: { type: 'number', minimum: 1, maximum: 2000, description: 'Number of projects per page (max 2000)' },
        },
        additionalProperties: false,
      },
    });

    // Register get_project tool
    this.tools.set('get_project', {
      name: 'get_project',
      description: 'Retrieve a specific project by its ID. Returns complete project details including client information, budget settings, billing configuration, and project dates.',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'number', description: 'The ID of the project to retrieve' },
        },
        required: ['project_id'],
        additionalProperties: false,
      },
    });

    // Register create_project tool
    this.tools.set('create_project', {
      name: 'create_project',
      description: 'Create a new project for a client. Requires project name and client ID. Supports extensive configuration including budget settings, billing preferences, and project timeline.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, description: 'Project name (required)' },
          client_id: { type: 'number', description: 'The client ID this project belongs to (required)' },
          code: { type: 'string', description: 'Project code for reference' },
          is_active: { type: 'boolean', description: 'Whether the project is active' },
          is_billable: { type: 'boolean', description: 'Whether the project is billable' },
          is_fixed_fee: { type: 'boolean', description: 'Whether the project uses fixed fee billing' },
          bill_by: { type: 'string', enum: ['Project', 'Tasks', 'People', 'none'], description: 'How to bill for this project' },
          hourly_rate: { type: 'number', minimum: 0, description: 'Default hourly rate for the project' },
          budget: { type: 'number', minimum: 0, description: 'Project budget amount' },
          budget_by: { type: 'string', enum: ['project', 'project_cost', 'task', 'task_fees', 'person', 'none'], description: 'How budget is calculated' },
          budget_is_monthly: { type: 'boolean', description: 'Whether budget resets monthly' },
          notify_when_over_budget: { type: 'boolean', description: 'Send notifications when over budget' },
          over_budget_notification_percentage: { type: 'number', minimum: 0, maximum: 100, description: 'Percentage threshold for budget notifications' },
          show_budget_to_all: { type: 'boolean', description: 'Show budget information to all team members' },
          cost_budget: { type: 'number', minimum: 0, description: 'Cost budget for the project' },
          cost_budget_include_expenses: { type: 'boolean', description: 'Include expenses in cost budget calculations' },
          fee: { type: 'number', minimum: 0, description: 'Fixed fee amount' },
          notes: { type: 'string', description: 'Project notes' },
          starts_on: { type: 'string', format: 'date', description: 'Project start date (YYYY-MM-DD)' },
          ends_on: { type: 'string', format: 'date', description: 'Project end date (YYYY-MM-DD)' },
        },
        required: ['name', 'client_id'],
        additionalProperties: false,
      },
    });

    // Register update_project tool
    this.tools.set('update_project', {
      name: 'update_project',
      description: 'Update an existing project. Can modify any project settings including name, billing configuration, budget settings, and project timeline. Only provided fields will be updated.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'The ID of the project to update (required)' },
          name: { type: 'string', minLength: 1, description: 'Update project name' },
          code: { type: 'string', description: 'Update project code' },
          is_active: { type: 'boolean', description: 'Update active status' },
          is_billable: { type: 'boolean', description: 'Update billable status' },
          is_fixed_fee: { type: 'boolean', description: 'Update fixed fee billing' },
          bill_by: { type: 'string', enum: ['Project', 'Tasks', 'People', 'none'], description: 'Update billing method' },
          hourly_rate: { type: 'number', minimum: 0, description: 'Update hourly rate' },
          budget: { type: 'number', minimum: 0, description: 'Update budget amount' },
          budget_by: { type: 'string', enum: ['project', 'project_cost', 'task', 'task_fees', 'person', 'none'], description: 'Update budget calculation method' },
          budget_is_monthly: { type: 'boolean', description: 'Update monthly budget reset' },
          notify_when_over_budget: { type: 'boolean', description: 'Update budget notifications' },
          over_budget_notification_percentage: { type: 'number', minimum: 0, maximum: 100, description: 'Update notification threshold' },
          show_budget_to_all: { type: 'boolean', description: 'Update budget visibility' },
          cost_budget: { type: 'number', minimum: 0, description: 'Update cost budget' },
          cost_budget_include_expenses: { type: 'boolean', description: 'Update expense inclusion' },
          fee: { type: 'number', minimum: 0, description: 'Update fixed fee' },
          notes: { type: 'string', description: 'Update project notes' },
          starts_on: { type: 'string', format: 'date', description: 'Update start date (YYYY-MM-DD)' },
          ends_on: { type: 'string', format: 'date', description: 'Update end date (YYYY-MM-DD)' },
        },
        required: ['id'],
        additionalProperties: false,
      },
    });

    // Register delete_project tool
    this.tools.set('delete_project', {
      name: 'delete_project',
      description: 'Delete (archive) a project. This action archives the project rather than permanently deleting it, preserving historical data while making it inactive.',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'number', description: 'The ID of the project to delete' },
        },
        required: ['project_id'],
        additionalProperties: false,
      },
    });
  }

  private registerTaskTools() {
    // Register list_tasks tool
    this.tools.set('list_tasks', {
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
    });

    // Register get_task tool
    this.tools.set('get_task', {
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
    });

    // Register create_task tool
    this.tools.set('create_task', {
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
    });

    // Register update_task tool
    this.tools.set('update_task', {
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
    });

    // Register delete_task tool
    this.tools.set('delete_task', {
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
    });

    // Register list_project_task_assignments tool
    this.tools.set('list_project_task_assignments', {
      name: 'list_project_task_assignments',
      description: 'Retrieve task assignments for a specific project. Shows which tasks are available for time tracking on the project and their specific settings.',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'number', description: 'The project ID to get task assignments for' },
          is_active: { type: 'boolean', description: 'Filter by active status' },
          updated_since: { type: 'string', format: 'date-time', description: 'Filter by assignments updated since this timestamp' },
          page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
          per_page: { type: 'number', minimum: 1, maximum: 2000, description: 'Number of assignments per page (max 2000)' },
        },
        required: ['project_id'],
        additionalProperties: false,
      },
    });

    // Register create_project_task_assignment tool
    this.tools.set('create_project_task_assignment', {
      name: 'create_project_task_assignment',
      description: 'Assign a task to a project, making it available for time tracking on that project. Allows setting project-specific rates and budgets.',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'number', description: 'The project ID to assign the task to' },
          task_id: { type: 'number', description: 'The task ID to assign' },
          is_active: { type: 'boolean', description: 'Whether the assignment is active' },
          billable: { type: 'boolean', description: 'Whether time tracked on this task is billable for this project' },
          hourly_rate: { type: 'number', minimum: 0, description: 'Project-specific hourly rate for this task' },
          budget: { type: 'number', minimum: 0, description: 'Budget allocated for this task on this project' },
        },
        required: ['project_id', 'task_id'],
        additionalProperties: false,
      },
    });

    // Register update_project_task_assignment tool
    this.tools.set('update_project_task_assignment', {
      name: 'update_project_task_assignment',
      description: 'Update a task assignment for a project. Can modify billing settings, rates, and budget allocation. Only provided fields will be updated.',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'number', description: 'The project ID the assignment belongs to' },
          id: { type: 'number', description: 'The task assignment ID to update' },
          is_active: { type: 'boolean', description: 'Update active status' },
          billable: { type: 'boolean', description: 'Update billable status' },
          hourly_rate: { type: 'number', minimum: 0, description: 'Update hourly rate' },
          budget: { type: 'number', minimum: 0, description: 'Update budget' },
        },
        required: ['project_id', 'id'],
        additionalProperties: false,
      },
    });

    // Register delete_project_task_assignment tool
    this.tools.set('delete_project_task_assignment', {
      name: 'delete_project_task_assignment',
      description: 'Remove a task assignment from a project, making the task unavailable for time tracking on that project.',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'number', description: 'The project ID' },
          task_assignment_id: { type: 'number', description: 'The task assignment ID to delete' },
        },
        required: ['project_id', 'task_assignment_id'],
        additionalProperties: false,
      },
    });
  }

  // Project method implementations
  private async listProjects(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = ProjectQuerySchema.parse(args);
      logger.info('Listing projects from Harvest API');
      const projects = await this.harvestClient.getProjects(validatedArgs);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(projects, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid projects query parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to list projects:', error);
      throw new Error(`Failed to retrieve projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getProject(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ project_id: z.number().int().positive() });
      const { project_id } = inputSchema.parse(args);
      
      logger.info('Fetching project from Harvest API', { projectId: project_id });
      const project = await this.harvestClient.getProject(project_id);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(project, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid project parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to fetch project:', error);
      throw new Error(`Failed to retrieve project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createProject(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = CreateProjectSchema.parse(args);
      logger.info('Creating project via Harvest API');
      const project = await this.harvestClient.createProject(validatedArgs);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(project, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid create project parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to create project:', error);
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateProject(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = UpdateProjectSchema.parse(args);
      logger.info('Updating project via Harvest API', { projectId: validatedArgs.id });
      const project = await this.harvestClient.updateProject(validatedArgs);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(project, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid update project parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to update project:', error);
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async deleteProject(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ project_id: z.number().int().positive() });
      const { project_id } = inputSchema.parse(args);
      
      logger.info('Deleting project via Harvest API', { projectId: project_id });
      await this.harvestClient.deleteProject(project_id);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ message: `Project ${project_id} deleted successfully` }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid delete project parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to delete project:', error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Task method implementations
  private async listTasks(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = TaskQuerySchema.parse(args);
      logger.info('Listing tasks from Harvest API');
      const tasks = await this.harvestClient.getTasks(validatedArgs);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(tasks, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid tasks query parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to list tasks:', error);
      throw new Error(`Failed to retrieve tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getTask(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ task_id: z.number().int().positive() });
      const { task_id } = inputSchema.parse(args);
      
      logger.info('Fetching task from Harvest API', { taskId: task_id });
      const task = await this.harvestClient.getTask(task_id);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(task, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid task parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to fetch task:', error);
      throw new Error(`Failed to retrieve task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createTask(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = CreateTaskSchema.parse(args);
      logger.info('Creating task via Harvest API');
      const task = await this.harvestClient.createTask(validatedArgs);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(task, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid create task parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to create task:', error);
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateTask(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = UpdateTaskSchema.parse(args);
      logger.info('Updating task via Harvest API', { taskId: validatedArgs.id });
      const task = await this.harvestClient.updateTask(validatedArgs);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(task, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid update task parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to update task:', error);
      throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async deleteTask(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ task_id: z.number().int().positive() });
      const { task_id } = inputSchema.parse(args);
      
      logger.info('Deleting task via Harvest API', { taskId: task_id });
      await this.harvestClient.deleteTask(task_id);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ message: `Task ${task_id} deleted successfully` }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid delete task parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to delete task:', error);
      throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async listProjectTaskAssignments(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({
        project_id: z.number().int().positive(),
        ...ProjectTaskAssignmentQuerySchema.shape
      });
      const { project_id, ...query } = inputSchema.parse(args);
      
      logger.info('Listing project task assignments from Harvest API', { projectId: project_id });
      const assignments = await this.harvestClient.getProjectTaskAssignments(project_id, query);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(assignments, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid project task assignments query parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to list project task assignments:', error);
      throw new Error(`Failed to retrieve project task assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createProjectTaskAssignment(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = CreateProjectTaskAssignmentSchema.extend({
        project_id: z.number().int().positive()
      }).parse(args);
      const { project_id, ...assignmentData } = validatedArgs;
      
      logger.info('Creating project task assignment via Harvest API', { projectId: project_id, taskId: assignmentData.task_id });
      const assignment = await this.harvestClient.createProjectTaskAssignment(project_id, assignmentData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(assignment, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid create project task assignment parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to create project task assignment:', error);
      throw new Error(`Failed to create project task assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateProjectTaskAssignment(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = UpdateProjectTaskAssignmentSchema.extend({
        project_id: z.number().int().positive()
      }).parse(args);
      const { project_id, ...assignmentData } = validatedArgs;
      
      logger.info('Updating project task assignment via Harvest API', { projectId: project_id, assignmentId: assignmentData.id });
      const assignment = await this.harvestClient.updateProjectTaskAssignment(project_id, assignmentData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(assignment, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid update project task assignment parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to update project task assignment:', error);
      throw new Error(`Failed to update project task assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async deleteProjectTaskAssignment(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ 
        project_id: z.number().int().positive(),
        task_assignment_id: z.number().int().positive()
      });
      const { project_id, task_assignment_id } = inputSchema.parse(args);
      
      logger.info('Deleting project task assignment via Harvest API', { projectId: project_id, assignmentId: task_assignment_id });
      await this.harvestClient.deleteProjectTaskAssignment(project_id, task_assignment_id);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ message: `Project task assignment ${task_assignment_id} deleted successfully from project ${project_id}` }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid delete project task assignment parameters:', error.errors);
        throw new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to delete project task assignment:', error);
      throw new Error(`Failed to delete project task assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      if (category === 'projects') {
        return tool.name.includes('project');
      }
      if (category === 'tasks') {
        return tool.name.includes('task');
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