import { AxiosResponse } from 'axios';
import { z } from 'zod';
import { BaseHarvestClient, HarvestAPIOptions } from './base-client';
import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  InvoiceQuerySchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type InvoiceQuery
} from '../schemas/invoice';

export class InvoicesClient extends BaseHarvestClient {
  constructor(options: HarvestAPIOptions) {
    super(options, 'invoices-client');
  }

  async getInvoices(query?: InvoiceQuery): Promise<any> {
    try {
      const validatedQuery = query ? InvoiceQuerySchema.parse(query) : {};
      const queryString = this.buildQueryString(validatedQuery);
      const url = queryString ? `/invoices?${queryString}` : '/invoices';
      
      this.logger.debug('Fetching invoices', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      this.logger.info('Successfully retrieved invoices', {
        count: response.data.invoices?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Invoices query validation failed:', error.errors);
        throw new Error('Invalid invoices query parameters');
      }
      throw error;
    }
  }

  async getInvoice(invoiceId: number): Promise<any> {
    try {
      this.logger.debug('Fetching invoice', { invoiceId });
      const response: AxiosResponse = await this.client.get(`/invoices/${invoiceId}`);
      
      this.logger.info('Successfully retrieved invoice', {
        invoiceId: response.data.id,
        invoiceNumber: response.data.number,
        amount: response.data.amount
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to retrieve invoice', { invoiceId, error: (error as Error).message });
      throw error;
    }
  }

  async createInvoice(input: CreateInvoiceInput): Promise<any> {
    try {
      const validatedInput = CreateInvoiceSchema.parse(input);
      
      this.logger.debug('Creating invoice', {
        clientId: validatedInput.client_id,
        subject: validatedInput.subject
      });
      
      const response: AxiosResponse = await this.client.post('/invoices', validatedInput);
      
      this.logger.info('Successfully created invoice', {
        invoiceId: response.data.id,
        invoiceNumber: response.data.number,
        amount: response.data.amount
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Create invoice validation failed:', error.errors);
        throw new Error('Invalid invoice input data');
      }
      throw error;
    }
  }

  async updateInvoice(input: UpdateInvoiceInput): Promise<any> {
    try {
      const validatedInput = UpdateInvoiceSchema.parse(input);
      const { id, ...updateData } = validatedInput;
      
      this.logger.debug('Updating invoice', {
        invoiceId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response: AxiosResponse = await this.client.patch(`/invoices/${id}`, updateData);
      
      this.logger.info('Successfully updated invoice', {
        invoiceId: response.data.id,
        invoiceNumber: response.data.number
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Update invoice validation failed:', error.errors);
        throw new Error('Invalid invoice update data');
      }
      throw error;
    }
  }

  async deleteInvoice(invoiceId: number): Promise<void> {
    try {
      this.logger.debug('Deleting invoice', { invoiceId });
      await this.client.delete(`/invoices/${invoiceId}`);
      this.logger.info('Successfully deleted invoice', { invoiceId });
    } catch (error) {
      this.logger.error('Failed to delete invoice', { invoiceId, error: (error as Error).message });
      throw error;
    }
  }
}