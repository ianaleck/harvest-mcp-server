/**
 * Project Tools for Harvest MCP Server
 * Handles project management, task assignments, and project configuration
 */

import { CallToolResult } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { createLogger } from '../utils/logger';
import { handleMCPToolError } from '../utils/errors';
import { validateInput } from '../utils/validation';
import { BaseToolConfig, ToolHandler, ToolRegistration } from '../types';
import { 
  ProjectQuerySchema,
  CreateProjectSchema,
  UpdateProjectSchema
} from '../schemas/project';
import {
  ProjectTaskAssignmentQuerySchema,
  CreateProjectTaskAssignmentSchema,
  UpdateProjectTaskAssignmentSchema
} from '../schemas/task';

const logger = createLogger('project-tools');

class ListProjectsHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(ProjectQuerySchema, args, 'project query');
      logger.info('Listing projects from Harvest API');
      const projects = await this.config.harvestClient.getProjects(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'list_projects');
    }
  }
}

class GetProjectHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ project_id: z.number().int().positive() });
      const { project_id } = validateInput(inputSchema, args, 'get project');
      
      logger.info('Fetching project from Harvest API', { projectId: project_id });
      const project = await this.config.harvestClient.getProject(project_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(project, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'get_project');
    }
  }
}

class CreateProjectHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(CreateProjectSchema, args, 'create project');
      logger.info('Creating project via Harvest API');
      const project = await this.config.harvestClient.createProject(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(project, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'create_project');
    }
  }
}

class UpdateProjectHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(UpdateProjectSchema, args, 'update project');
      logger.info('Updating project via Harvest API', { projectId: validatedArgs.id });
      const project = await this.config.harvestClient.updateProject(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(project, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'update_project');
    }
  }
}

class DeleteProjectHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ project_id: z.number().int().positive() });
      const { project_id } = validateInput(inputSchema, args, 'delete project');
      
      logger.info('Deleting project via Harvest API', { projectId: project_id });
      await this.config.harvestClient.deleteProject(project_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify({ message: `Project ${project_id} deleted successfully` }, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'delete_project');
    }
  }
}

class ListProjectTaskAssignmentsHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(ProjectTaskAssignmentQuerySchema, args, 'project task assignments query');
      logger.info('Listing project task assignments from Harvest API', { projectId: validatedArgs.project_id });
      const assignments = await this.config.harvestClient.getProjectTaskAssignments(validatedArgs.project_id, validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(assignments, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'list_project_task_assignments');
    }
  }
}

class CreateProjectTaskAssignmentHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(CreateProjectTaskAssignmentSchema, args, 'create project task assignment');
      logger.info('Creating project task assignment via Harvest API', { projectId: validatedArgs.project_id, taskId: validatedArgs.task_id });
      const assignment = await this.config.harvestClient.createProjectTaskAssignment(validatedArgs.project_id, validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(assignment, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'create_project_task_assignment');
    }
  }
}

class UpdateProjectTaskAssignmentHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(UpdateProjectTaskAssignmentSchema, args, 'update project task assignment');
      logger.info('Updating project task assignment via Harvest API', { 
        projectId: validatedArgs.project_id, 
        taskAssignmentId: validatedArgs.id 
      });
      const assignment = await this.config.harvestClient.updateProjectTaskAssignment(validatedArgs.project_id, validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(assignment, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'update_project_task_assignment');
    }
  }
}

class DeleteProjectTaskAssignmentHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({
        project_id: z.number().int().positive(),
        task_assignment_id: z.number().int().positive(),
      });
      const { project_id, task_assignment_id } = validateInput(inputSchema, args, 'delete project task assignment');
      
      logger.info('Deleting project task assignment via Harvest API', { 
        projectId: project_id, 
        taskAssignmentId: task_assignment_id 
      });
      await this.config.harvestClient.deleteProjectTaskAssignment(project_id, task_assignment_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify({ 
          message: `Task assignment ${task_assignment_id} deleted from project ${project_id} successfully` 
        }, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'delete_project_task_assignment');
    }
  }
}

export function registerProjectTools(config: BaseToolConfig): ToolRegistration[] {
  return [
    {
      tool: {
        name: 'list_projects',
        description: 'Retrieve a list of projects with optional filtering by client, active status, and updated date. Returns paginated results with comprehensive project details.',
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
      },
      handler: new ListProjectsHandler(config),
    },
    {
      tool: {
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
      },
      handler: new GetProjectHandler(config),
    },
    {
      tool: {
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
      },
      handler: new CreateProjectHandler(config),
    },
    {
      tool: {
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
      },
      handler: new UpdateProjectHandler(config),
    },
    {
      tool: {
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
      },
      handler: new DeleteProjectHandler(config),
    },
    {
      tool: {
        name: 'list_project_task_assignments',
        description: 'Retrieve task assignments for a specific project. Shows which tasks are available for time tracking on the project and their specific settings.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'number', description: 'The project ID to get task assignments for (required)' },
            is_active: { type: 'boolean', description: 'Filter by active status' },
            updated_since: { type: 'string', format: 'date-time', description: 'Filter by assignments updated since this timestamp' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            per_page: { type: 'number', minimum: 1, maximum: 2000, description: 'Number of assignments per page (max 2000)' },
          },
          required: ['project_id'],
          additionalProperties: false,
        },
      },
      handler: new ListProjectTaskAssignmentsHandler(config),
    },
    {
      tool: {
        name: 'create_project_task_assignment',
        description: 'Assign a task to a project, making it available for time tracking on that project. Allows setting project-specific rates and budgets.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'number', description: 'The project ID to assign the task to (required)' },
            task_id: { type: 'number', description: 'The task ID to assign (required)' },
            is_active: { type: 'boolean', description: 'Whether this assignment is active' },
            billable: { type: 'boolean', description: 'Whether time tracked on this task is billable' },
            hourly_rate: { type: 'number', minimum: 0, description: 'Hourly rate for this task on this project' },
            budget: { type: 'number', minimum: 0, description: 'Budget allocation for this task' },
          },
          required: ['project_id', 'task_id'],
          additionalProperties: false,
        },
      },
      handler: new CreateProjectTaskAssignmentHandler(config),
    },
    {
      tool: {
        name: 'update_project_task_assignment',
        description: 'Update an existing project task assignment including rates, budget, and active status. Only provided fields will be updated.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'number', description: 'The project ID (required)' },
            id: { type: 'number', description: 'The task assignment ID to update (required)' },
            is_active: { type: 'boolean', description: 'Update active status' },
            billable: { type: 'boolean', description: 'Update billable status' },
            hourly_rate: { type: 'number', minimum: 0, description: 'Update hourly rate' },
            budget: { type: 'number', minimum: 0, description: 'Update budget allocation' },
          },
          required: ['project_id', 'id'],
          additionalProperties: false,
        },
      },
      handler: new UpdateProjectTaskAssignmentHandler(config),
    },
    {
      tool: {
        name: 'delete_project_task_assignment',
        description: 'Remove a task assignment from a project, making the task unavailable for time tracking on that project.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'number', description: 'The project ID (required)' },
            task_assignment_id: { type: 'number', description: 'The task assignment ID to delete (required)' },
          },
          required: ['project_id', 'task_assignment_id'],
          additionalProperties: false,
        },
      },
      handler: new DeleteProjectTaskAssignmentHandler(config),
    },
  ];
}