import { AxiosResponse } from 'axios';
import { z } from 'zod';
import { BaseHarvestClient, HarvestAPIOptions } from './base-client';
import {
  InvoicePaymentQuerySchema,
  RecordInvoicePaymentSchema,
  InvoicePaymentSchema,
  InvoicePaymentsListSchema,
  type InvoicePayment,
  type InvoicePaymentsList,
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  InvoiceQuerySchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type InvoiceQuery,
  type InvoicePaymentQuery,
  type RecordInvoicePaymentInput
} from '../schemas/invoice';

/** A successful payment response was unreadable; a validated ID can still prevent duplicate writes. */
export class InvoicePaymentResponseError extends Error {
  constructor(public readonly paymentId?: number) {
    super('Invalid invoice payment response');
    this.name = 'InvoicePaymentResponseError';
  }
}

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

  /** List validated payments, following only pagination URLs for the same Harvest invoice. */
  async getInvoicePayments(
    invoiceId: number,
    query: Omit<InvoicePaymentQuery, 'invoice_id'> = {}
  ): Promise<InvoicePaymentsList> {
    const { invoice_id: _invoiceId, ...validatedQuery } = InvoicePaymentQuerySchema.parse({
      ...query,
      invoice_id: invoiceId,
    });
    query = validatedQuery;
    let url: string;
    if (query.page_url) {
      const next = new URL(query.page_url);
      const expected = new URL(`${this.baseUrl.replace(/\/+$/, '')}/invoices/${invoiceId}/payments`);
      if (
        next.origin !== expected.origin ||
        next.pathname !== expected.pathname ||
        next.username ||
        next.password ||
        next.hash ||
        query.per_page !== undefined ||
        query.updated_since !== undefined
      ) {
        throw new Error('Invalid payment pagination URL');
      }
      url = `/invoices/${invoiceId}/payments${next.search}`;
    } else {
      const queryString = this.buildQueryString({
        updated_since: query.updated_since,
        per_page: query.per_page,
      });
      url = `/invoices/${invoiceId}/payments${queryString ? `?${queryString}` : ''}`;
    }
    const response: AxiosResponse = await this.client.get(url, { maxRedirects: 0 });
    const parsed = InvoicePaymentsListSchema.safeParse(response.data);
    if (!parsed.success) throw new Error('Invalid invoice payments response');
    return parsed.data;
  }

  /** Record one payment without retry or redirects; reconcile any uncertain response before retrying. */
  async createInvoicePayment(
    invoiceId: number,
    input: Omit<RecordInvoicePaymentInput, 'invoice_id'>
  ): Promise<InvoicePayment> {
    const { invoice_id: _invoiceId, ...validatedInput } = RecordInvoicePaymentSchema.parse({
      ...input,
      invoice_id: invoiceId,
    });
    // A payment POST is not idempotent. The caller must reconcile any ambiguous failure.
    const response: AxiosResponse = await this.client.post(
      `/invoices/${invoiceId}/payments`,
      validatedInput,
      { maxRedirects: 0 }
    );
    const parsed = InvoicePaymentSchema.safeParse(response.data);
    if (!parsed.success) {
      const identity = z.object({ id: z.number().int().positive() }).safeParse(response.data);
      throw new InvoicePaymentResponseError(identity.success ? identity.data.id : undefined);
    }
    return parsed.data;
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