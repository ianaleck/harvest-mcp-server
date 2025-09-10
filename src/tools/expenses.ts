/**
 * Expense Tools for Harvest MCP Server
 * Handles expense tracking, receipt management, and expense category operations
 */

import { CallToolResult } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { createLogger } from '../utils/logger';
import { handleMCPToolError } from '../utils/errors';
import { validateInput } from '../utils/validation';
import { BaseToolConfig, ToolHandler, ToolRegistration } from '../types';
import { 
  ExpenseQuerySchema,
  CreateExpenseSchema,
  UpdateExpenseSchema,
  ExpenseCategoryQuerySchema,
} from '../schemas/expense';

const logger = createLogger('expense-tools');

class ListExpensesHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(ExpenseQuerySchema, args, 'expense query');
      logger.info('Listing expenses from Harvest API');
      const expenses = await this.config.harvestClient.getExpenses(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(expenses, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'list_expenses');
    }
  }
}

class GetExpenseHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ expense_id: z.number().int().positive() });
      const { expense_id } = validateInput(inputSchema, args, 'get expense');
      
      logger.info('Fetching expense from Harvest API', { expenseId: expense_id });
      const expense = await this.config.harvestClient.getExpense(expense_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(expense, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'get_expense');
    }
  }
}

class CreateExpenseHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(CreateExpenseSchema, args, 'create expense');
      logger.info('Creating expense via Harvest API');
      const expense = await this.config.harvestClient.createExpense(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(expense, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'create_expense');
    }
  }
}

class UpdateExpenseHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(UpdateExpenseSchema, args, 'update expense');
      logger.info('Updating expense via Harvest API', { expenseId: validatedArgs.id });
      const expense = await this.config.harvestClient.updateExpense(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(expense, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'update_expense');
    }
  }
}

class DeleteExpenseHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ expense_id: z.number().int().positive() });
      const { expense_id } = validateInput(inputSchema, args, 'delete expense');
      
      logger.info('Deleting expense via Harvest API', { expenseId: expense_id });
      await this.config.harvestClient.deleteExpense(expense_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify({ message: `Expense ${expense_id} deleted successfully` }, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'delete_expense');
    }
  }
}

class ListExpenseCategoriesHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(ExpenseCategoryQuerySchema, args, 'expense categories query');
      logger.info('Listing expense categories from Harvest API');
      const categories = await this.config.harvestClient.getExpenseCategories(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(categories, null, 2) }],
      };
    } catch (error) {
      handleMCPToolError(error, 'list_expense_categories');
    }
  }
}

export function registerExpenseTools(config: BaseToolConfig): ToolRegistration[] {
  return [
    {
      tool: {
        name: 'list_expenses',
        description: 'Retrieve expenses with filtering by user, client, project, billing status, and date ranges. Returns paginated results with expense details.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: { type: 'number', description: 'Filter by user ID' },
            client_id: { type: 'number', description: 'Filter by client ID' },
            project_id: { type: 'number', description: 'Filter by project ID' },
            is_billed: { type: 'boolean', description: 'Filter by billing status' },
            is_closed: { type: 'boolean', description: 'Filter by closed status' },
            from: { type: 'string', format: 'date', description: 'Start date for date range filter (YYYY-MM-DD)' },
            to: { type: 'string', format: 'date', description: 'End date for date range filter (YYYY-MM-DD)' },
            updated_since: { type: 'string', format: 'date-time', description: 'Filter by expenses updated since this timestamp' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            per_page: { type: 'number', minimum: 1, maximum: 2000, description: 'Number of expenses per page (max 2000)' },
          },
          additionalProperties: false,
        },
      },
      handler: new ListExpensesHandler(config),
    },
    {
      tool: {
        name: 'get_expense',
        description: 'Retrieve a specific expense by ID with complete details including receipts and billing information.',
        inputSchema: {
          type: 'object',
          properties: {
            expense_id: { type: 'number', description: 'The ID of the expense to retrieve' },
          },
          required: ['expense_id'],
          additionalProperties: false,
        },
      },
      handler: new GetExpenseHandler(config),
    },
    {
      tool: {
        name: 'create_expense',
        description: 'Create a new expense entry for a project with category and cost details. Supports receipt attachment and billable status.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: { type: 'number', description: 'The user ID who incurred the expense' },
            project_id: { type: 'number', description: 'The project ID to associate the expense with (required)' },
            expense_category_id: { type: 'number', description: 'The expense category ID (required)' },
            spent_date: { type: 'string', format: 'date', description: 'Date the expense was incurred (YYYY-MM-DD) (required)' },
            notes: { type: 'string', description: 'Notes or description for the expense' },
            total_cost: { type: 'number', minimum: 0, description: 'Total cost of the expense (required)' },
            units: { type: 'number', minimum: 0, description: 'Number of units for unit-based expenses' },
            billable: { type: 'boolean', description: 'Whether the expense is billable to the client' },
          },
          required: ['project_id', 'expense_category_id', 'spent_date', 'total_cost'],
          additionalProperties: false,
        },
      },
      handler: new CreateExpenseHandler(config),
    },
    {
      tool: {
        name: 'update_expense',
        description: 'Update an existing expense including project, category, cost, and billing details. Only provided fields will be updated.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The ID of the expense to update (required)' },
            user_id: { type: 'number', description: 'Update the user ID' },
            project_id: { type: 'number', description: 'Update the project ID' },
            expense_category_id: { type: 'number', description: 'Update the expense category ID' },
            spent_date: { type: 'string', format: 'date', description: 'Update the spent date' },
            notes: { type: 'string', description: 'Update the notes' },
            total_cost: { type: 'number', minimum: 0, description: 'Update the total cost' },
            units: { type: 'number', minimum: 0, description: 'Update the units' },
            billable: { type: 'boolean', description: 'Update the billable status' },
          },
          required: ['id'],
          additionalProperties: false,
        },
      },
      handler: new UpdateExpenseHandler(config),
    },
    {
      tool: {
        name: 'delete_expense',
        description: 'Delete an expense permanently. This action cannot be undone.',
        inputSchema: {
          type: 'object',
          properties: {
            expense_id: { type: 'number', description: 'The ID of the expense to delete' },
          },
          required: ['expense_id'],
          additionalProperties: false,
        },
      },
      handler: new DeleteExpenseHandler(config),
    },
    {
      tool: {
        name: 'list_expense_categories',
        description: 'Retrieve available expense categories for expense classification and organization.',
        inputSchema: {
          type: 'object',
          properties: {
            is_active: { type: 'boolean', description: 'Filter by active status' },
            updated_since: { type: 'string', format: 'date-time', description: 'Filter by categories updated since this timestamp' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            per_page: { type: 'number', minimum: 1, maximum: 2000, description: 'Number of categories per page (max 2000)' },
          },
          additionalProperties: false,
        },
      },
      handler: new ListExpenseCategoriesHandler(config),
    },
  ];
}