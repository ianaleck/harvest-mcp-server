import { AxiosResponse } from 'axios';
import { z } from 'zod';
import { BaseHarvestClient, HarvestAPIOptions } from './base-client';
import {
  TimeReportQuerySchema,
  ExpenseReportQuerySchema,
  ProjectBudgetReportQuerySchema,
  UninvoicedReportQuerySchema,
  type TimeReportQuery,
  type ExpenseReportQuery,
  type ProjectBudgetReportQuery,
  type UninvoicedReportQuery
} from '../schemas/report';

export class ReportsClient extends BaseHarvestClient {
  constructor(options: HarvestAPIOptions) {
    super(options, 'reports-client');
  }

  async getTimeReport(query: TimeReportQuery): Promise<any> {
    try {
      const validatedQuery = TimeReportQuerySchema.parse(query);
      
      // Provide default date range if not specified (last 30 days)
      const finalQuery = {
        ...validatedQuery,
        from: validatedQuery.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: validatedQuery.to || new Date().toISOString().split('T')[0]
      };
      
      const queryString = this.buildQueryString(finalQuery);
      // Determine endpoint based on group_by parameter
      const baseEndpoint = finalQuery.group_by === 'project' 
        ? '/reports/time/projects'
        : finalQuery.group_by === 'client'
        ? '/reports/time/clients'
        : finalQuery.group_by === 'task'
        ? '/reports/time/tasks'
        : '/reports/time';
      const url = `${baseEndpoint}?${queryString}`;
      
      this.logger.debug('Fetching time report', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      this.logger.info('Successfully retrieved time report', {
        totalHours: response.data.total_hours,
        totalAmount: response.data.total_amount
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Time report query validation failed:', error.errors);
        throw new Error('Invalid time report query parameters');
      }
      throw error;
    }
  }

  async getExpenseReport(query: ExpenseReportQuery): Promise<any> {
    try {
      const validatedQuery = ExpenseReportQuerySchema.parse(query);
      
      // Provide default date range if not specified (last 30 days)
      const finalQuery = {
        ...validatedQuery,
        from: validatedQuery.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: validatedQuery.to || new Date().toISOString().split('T')[0]
      };
      
      const queryString = this.buildQueryString(finalQuery);
      // Determine endpoint based on group_by parameter
      const baseEndpoint = finalQuery.group_by === 'project' 
        ? '/reports/expenses/projects'
        : finalQuery.group_by === 'client'
        ? '/reports/expenses/clients'
        : '/reports/expenses';
      const url = `${baseEndpoint}?${queryString}`;
      
      this.logger.debug('Fetching expense report', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      this.logger.info('Successfully retrieved expense report', {
        totalAmount: response.data.total_amount,
        totalBillableAmount: response.data.total_billable_amount
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Expense report query validation failed:', error.errors);
        throw new Error('Invalid expense report query parameters');
      }
      throw error;
    }
  }

  async getProjectBudgetReport(query?: ProjectBudgetReportQuery): Promise<any> {
    try {
      const validatedQuery = query ? ProjectBudgetReportQuerySchema.parse(query) : {};
      const queryString = this.buildQueryString(validatedQuery);
      const url = queryString ? `/reports/project_budget?${queryString}` : '/reports/project_budget';
      
      this.logger.debug('Fetching project budget report', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      this.logger.info('Successfully retrieved project budget report', {
        projectCount: response.data.results?.length || 0
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Project budget report query validation failed:', error.errors);
        throw new Error('Invalid project budget report query parameters');
      }
      throw error;
    }
  }

  async getUninvoicedReport(query: UninvoicedReportQuery): Promise<any> {
    try {
      const validatedQuery = UninvoicedReportQuerySchema.parse(query);
      
      // Provide default date range if not specified (last 30 days)
      const finalQuery = {
        ...validatedQuery,
        from: validatedQuery.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: validatedQuery.to || new Date().toISOString().split('T')[0]
      };
      
      const queryString = this.buildQueryString(finalQuery);
      const url = `/reports/uninvoiced?${queryString}`;
      
      this.logger.debug('Fetching uninvoiced report', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      this.logger.info('Successfully retrieved uninvoiced report', {
        totalHours: response.data.total_hours,
        totalAmount: response.data.total_amount
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Uninvoiced report query validation failed:', error.errors);
        throw new Error('Invalid uninvoiced report query parameters');
      }
      throw error;
    }
  }
}