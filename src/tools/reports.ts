/**
 * Report Tools for Harvest MCP Server
 * Handles report generation for time tracking, expenses, budgets, and billing analytics
 */

import { CallToolResult } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { createLogger } from '../utils/logger';
import { handleMCPToolError } from '../utils/errors';
import { validateInput } from '../utils/validation';
import { BaseToolConfig, ToolHandler, ToolRegistration } from '../types';
import { 
  TimeReportQuerySchema,
  ExpenseReportQuerySchema,
  ProjectBudgetReportQuerySchema,
  UninvoicedReportQuerySchema
} from '../schemas/report';

const logger = createLogger('report-tools');

class GetTimeReportHandler implements ToolHandler {
  constructor(private config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(TimeReportQuerySchema, args, 'time report query');
      logger.info('Generating time report from Harvest API');
      const report = await this.config.harvestClient.getTimeReport(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(report, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'get_time_report');
    }
  }
}

class GetExpenseReportHandler implements ToolHandler {
  constructor(private config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(ExpenseReportQuerySchema, args, 'expense report query');
      logger.info('Generating expense report from Harvest API');
      const report = await this.config.harvestClient.getExpenseReport(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(report, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'get_expense_report');
    }
  }
}

class GetProjectBudgetReportHandler implements ToolHandler {
  constructor(private config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(ProjectBudgetReportQuerySchema, args, 'project budget report query');
      logger.info('Generating project budget report from Harvest API');
      const report = await this.config.harvestClient.getProjectBudgetReport(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(report, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'get_project_budget_report');
    }
  }
}

class GetUninvoicedReportHandler implements ToolHandler {
  constructor(private config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(UninvoicedReportQuerySchema, args, 'uninvoiced report query');
      logger.info('Generating uninvoiced report from Harvest API');
      const report = await this.config.harvestClient.getUninvoicedReport(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(report, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'get_uninvoiced_report');
    }
  }
}

export function registerReportTools(config: BaseToolConfig): ToolRegistration[] {
  return [
    {
      tool: {
        name: 'get_time_report',
        description: 'Generate comprehensive time tracking reports with filtering by date range, users, clients, projects, and tasks. Supports grouping and billable status filtering.',
        inputSchema: {
          type: 'object',
          properties: {
            from: { type: 'string', format: 'date', description: 'Start date for report (YYYY-MM-DD) (required)' },
            to: { type: 'string', format: 'date', description: 'End date for report (YYYY-MM-DD) (required)' },
            user_id: { type: 'number', description: 'Filter by specific user ID' },
            client_id: { type: 'number', description: 'Filter by specific client ID' },
            project_id: { type: 'number', description: 'Filter by specific project ID' },
            task_id: { type: 'number', description: 'Filter by specific task ID' },
            billable: { type: 'boolean', description: 'Filter by billable status' },
            is_billed: { type: 'boolean', description: 'Filter by billed status' },
            is_running: { type: 'boolean', description: 'Filter by running timer status' },
            updated_since: { type: 'string', format: 'date-time', description: 'Filter by entries updated since this timestamp' },
            group_by: { type: 'string', enum: ['user', 'client', 'project', 'task', 'date'], description: 'Group report results by specified dimension' },
          },
          required: ['from', 'to'],
          additionalProperties: false,
        },
      },
      handler: new GetTimeReportHandler(config),
    },
    {
      tool: {
        name: 'get_expense_report',
        description: 'Generate comprehensive expense reports with filtering by date range, users, clients, projects, and categories. Supports grouping and billing status filtering.',
        inputSchema: {
          type: 'object',
          properties: {
            from: { type: 'string', format: 'date', description: 'Start date for report (YYYY-MM-DD) (required)' },
            to: { type: 'string', format: 'date', description: 'End date for report (YYYY-MM-DD) (required)' },
            user_id: { type: 'number', description: 'Filter by specific user ID' },
            client_id: { type: 'number', description: 'Filter by specific client ID' },
            project_id: { type: 'number', description: 'Filter by specific project ID' },
            expense_category_id: { type: 'number', description: 'Filter by specific expense category ID' },
            billable: { type: 'boolean', description: 'Filter by billable status' },
            is_billed: { type: 'boolean', description: 'Filter by billed status' },
            updated_since: { type: 'string', format: 'date-time', description: 'Filter by expenses updated since this timestamp' },
            group_by: { type: 'string', enum: ['user', 'client', 'project', 'expense_category', 'date'], description: 'Group report results by specified dimension' },
          },
          required: ['from', 'to'],
          additionalProperties: false,
        },
      },
      handler: new GetExpenseReportHandler(config),
    },
    {
      tool: {
        name: 'get_project_budget_report',
        description: 'Generate project budget reports showing spending vs budgets across projects. Helps track project profitability and budget utilization.',
        inputSchema: {
          type: 'object',
          properties: {
            is_active: { type: 'boolean', description: 'Filter by active projects only' },
            client_id: { type: 'number', description: 'Filter by specific client ID' },
            over_budget: { type: 'boolean', description: 'Filter by projects that are over budget' },
          },
          additionalProperties: false,
        },
      },
      handler: new GetProjectBudgetReportHandler(config),
    },
    {
      tool: {
        name: 'get_uninvoiced_report',
        description: 'Generate reports of uninvoiced time and expenses within a date range. Essential for identifying billable work that hasn\'t been invoiced yet.',
        inputSchema: {
          type: 'object',
          properties: {
            from: { type: 'string', format: 'date', description: 'Start date for report (YYYY-MM-DD) (required)' },
            to: { type: 'string', format: 'date', description: 'End date for report (YYYY-MM-DD) (required)' },
            client_id: { type: 'number', description: 'Filter by specific client ID' },
            project_id: { type: 'number', description: 'Filter by specific project ID' },
          },
          required: ['from', 'to'],
          additionalProperties: false,
        },
      },
      handler: new GetUninvoicedReportHandler(config),
    },
  ];
}