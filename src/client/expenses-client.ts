import { AxiosResponse } from 'axios';
import { z } from 'zod';
import { BaseHarvestClient, HarvestAPIOptions } from './base-client';
import {
  CreateExpenseSchema,
  UpdateExpenseSchema,
  ExpenseQuerySchema,
  ExpenseCategoryQuerySchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type ExpenseQuery,
  type ExpenseCategoryQuery
} from '../schemas/expense';

export class ExpensesClient extends BaseHarvestClient {
  constructor(options: HarvestAPIOptions) {
    super(options, 'expenses-client');
  }

  async getExpenses(query?: ExpenseQuery): Promise<any> {
    try {
      const validatedQuery = query ? ExpenseQuerySchema.parse(query) : {};
      const queryString = this.buildQueryString(validatedQuery);
      const url = queryString ? `/expenses?${queryString}` : '/expenses';
      
      this.logger.debug('Fetching expenses', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      this.logger.info('Successfully retrieved expenses', {
        count: response.data.expenses?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Expenses query validation failed:', error.errors);
        throw new Error('Invalid expenses query parameters');
      }
      throw error;
    }
  }

  async getExpense(expenseId: number): Promise<any> {
    try {
      this.logger.debug('Fetching expense', { expenseId });
      const response: AxiosResponse = await this.client.get(`/expenses/${expenseId}`);
      
      this.logger.info('Successfully retrieved expense', {
        expenseId: response.data.id,
        totalCost: response.data.total_cost,
        spentDate: response.data.spent_date
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to retrieve expense', { expenseId, error: (error as Error).message });
      throw error;
    }
  }

  async createExpense(input: CreateExpenseInput): Promise<any> {
    try {
      const validatedInput = CreateExpenseSchema.parse(input);
      
      this.logger.debug('Creating expense', {
        projectId: validatedInput.project_id,
        totalCost: validatedInput.total_cost,
        spentDate: validatedInput.spent_date
      });
      
      const response: AxiosResponse = await this.client.post('/expenses', validatedInput);
      
      this.logger.info('Successfully created expense', {
        expenseId: response.data.id,
        totalCost: response.data.total_cost
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Create expense validation failed:', error.errors);
        throw new Error('Invalid expense input data');
      }
      throw error;
    }
  }

  async updateExpense(input: UpdateExpenseInput): Promise<any> {
    try {
      const validatedInput = UpdateExpenseSchema.parse(input);
      const { id, ...updateData } = validatedInput;
      
      this.logger.debug('Updating expense', {
        expenseId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response: AxiosResponse = await this.client.patch(`/expenses/${id}`, updateData);
      
      this.logger.info('Successfully updated expense', {
        expenseId: response.data.id,
        totalCost: response.data.total_cost
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Update expense validation failed:', error.errors);
        throw new Error('Invalid expense update data');
      }
      throw error;
    }
  }

  async deleteExpense(expenseId: number): Promise<void> {
    try {
      this.logger.debug('Deleting expense', { expenseId });
      await this.client.delete(`/expenses/${expenseId}`);
      this.logger.info('Successfully deleted expense', { expenseId });
    } catch (error) {
      this.logger.error('Failed to delete expense', { expenseId, error: (error as Error).message });
      throw error;
    }
  }

  async getExpenseCategories(query?: ExpenseCategoryQuery): Promise<any> {
    try {
      const validatedQuery = query ? ExpenseCategoryQuerySchema.parse(query) : {};
      const queryString = this.buildQueryString(validatedQuery);
      const url = queryString ? `/expense_categories?${queryString}` : '/expense_categories';
      
      this.logger.debug('Fetching expense categories', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      this.logger.info('Successfully retrieved expense categories', {
        count: response.data.expense_categories?.length || 0
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Expense categories query validation failed:', error.errors);
        throw new Error('Invalid expense categories query parameters');
      }
      throw error;
    }
  }
}