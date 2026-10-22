/**
 * Invoice Tools for Harvest MCP Server
 * Handles invoice management, billing operations, and payment tracking
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { InvoicePaymentResponseError } from '../client/invoices-client';
import { createLogger } from '../utils/logger';
import { HarvestAPIError, handleMCPToolError } from '../utils/errors';
import { validateInput } from '../utils/validation';
import { BaseToolConfig, ToolHandler, ToolRegistration } from '../types';
import { 
  InvoicePaymentBalanceSchema,
  type InvoicePayment,
  type RecordInvoicePaymentInput,
  InvoicePaymentQuerySchema,
  RecordInvoicePaymentSchema,
  InvoiceQuerySchema,
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
} from '../schemas/invoice';

const logger = createLogger('invoice-tools');

class ListInvoicesHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(InvoiceQuerySchema, args, 'invoice query');
      logger.info('Listing invoices from Harvest API');
      const invoices = await this.config.harvestClient.getInvoices(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(invoices, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'list_invoices');
    }
  }
}

class GetInvoiceHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ invoice_id: z.number().int().positive() });
      const { invoice_id } = validateInput(inputSchema, args, 'get invoice');
      
      logger.info('Fetching invoice from Harvest API', { invoiceId: invoice_id });
      const invoice = await this.config.harvestClient.getInvoice(invoice_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(invoice, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'get_invoice');
    }
  }
}

class CreateInvoiceHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(CreateInvoiceSchema, args, 'create invoice');
      logger.info('Creating invoice via Harvest API');
      const invoice = await this.config.harvestClient.createInvoice(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(invoice, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'create_invoice');
    }
  }
}

class UpdateInvoiceHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const validatedArgs = validateInput(UpdateInvoiceSchema, args, 'update invoice');
      logger.info('Updating invoice via Harvest API', { invoiceId: validatedArgs.id });
      const invoice = await this.config.harvestClient.updateInvoice(validatedArgs);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(invoice, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'update_invoice');
    }
  }
}

class DeleteInvoiceHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const inputSchema = z.object({ invoice_id: z.number().int().positive() });
      const { invoice_id } = validateInput(inputSchema, args, 'delete invoice');
      
      logger.info('Deleting invoice via Harvest API', { invoiceId: invoice_id });
      await this.config.harvestClient.deleteInvoice(invoice_id);
      
      return {
        content: [{ type: 'text', text: JSON.stringify({ message: `Invoice ${invoice_id} deleted successfully` }, null, 2) }],
      };
    } catch (error) {
      return handleMCPToolError(error, 'delete_invoice');
    }
  }
}

class ListInvoicePaymentsHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const { invoice_id, ...query } = validateInput(
        InvoicePaymentQuerySchema,
        args,
        'invoice payment query'
      );
      const payments = await this.config.harvestClient.getInvoicePayments(invoice_id, query);
      return { content: [{ type: 'text', text: JSON.stringify(payments, null, 2) }] };
    } catch (error) {
      return handleMCPToolError(error, 'list_invoice_payments');
    }
  }
}

class RecordInvoicePaymentHandler implements ToolHandler {
  constructor(private readonly config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    let invoiceId: number;
    let input: Omit<RecordInvoicePaymentInput, 'invoice_id'>;
    try {
      const validated = RecordInvoicePaymentSchema.parse(args);
      invoiceId = validated.invoice_id;
      const { invoice_id: _, ...paymentInput } = validated;
      input = paymentInput;
    } catch (error) {
      return handleMCPToolError(error, 'record_invoice_payment');
    }

    let payment: InvoicePayment;
    try {
      payment = await this.config.harvestClient.createInvoicePayment(invoiceId, input);
    } catch (error) {
      if (
        error instanceof HarvestAPIError &&
        error.status !== undefined &&
        error.status >= 400 && error.status < 500
      ) {
        return handleMCPToolError(error, 'record_invoice_payment');
      }
      if (error instanceof InvoicePaymentResponseError && error.paymentId !== undefined) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'recorded_response_invalid',
                  payment_id: error.paymentId,
                  message:
                    'Harvest returned a payment ID, but the remaining response was invalid. Check this payment and do not retry this payment POST.',
                },
                null,
                2
              ),
            },
          ],
        };
      }
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Payment submission outcome is unknown. Check existing invoice payments before retrying; a second POST could record a duplicate payment.',
          },
        ],
      };
    }

    try {
      const invoice = InvoicePaymentBalanceSchema.parse(
        await this.config.harvestClient.getInvoice(invoiceId)
      );
      if (invoice.id !== invoiceId) throw new Error('Invoice verification ID mismatch');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'recorded',
                payment,
                invoice: { id: invoice.id, due_amount: invoice.due_amount, state: invoice.state },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'recorded_verification_failed',
                payment,
                message:
                  'Payment was recorded, but the invoice balance could not be verified. Check the invoice and do not retry this payment POST.',
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
}

export function registerInvoiceTools(config: BaseToolConfig): ToolRegistration[] {
  return [
    {
      tool: {
        name: 'list_invoice_payments',
        description:
          'List payments recorded against an invoice. Returns Harvest pagination links; pass links.next as page_url for the next cursor page.',
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
        inputSchema: {
          type: 'object',
          properties: {
            invoice_id: { type: 'integer', minimum: 1, description: 'Invoice ID' },
            updated_since: {
              type: 'string',
              format: 'date-time',
              description: 'Only payments updated since this timestamp',
            },
            per_page: {
              type: 'integer',
              minimum: 1,
              maximum: 2000,
              description: 'Payments per page',
            },
            page_url: {
              type: 'string',
              format: 'uri',
              description:
                'A pagination URL returned in links.next, previous, first, or last. Use alone with invoice_id.',
            },
          },
          required: ['invoice_id'],
          additionalProperties: false,
        },
      },
      handler: new ListInvoicePaymentsHandler(config),
    },
    {
      tool: {
        name: 'record_invoice_payment',
        description:
          'Record one full or partial invoice payment. Requires a payment date. Defaults send_thank_you to false. Payment creation is not idempotent: after an uncertain submission, inspect existing payments before retrying.',
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
        },
        inputSchema: {
          type: 'object',
          properties: {
            invoice_id: { type: 'integer', minimum: 1, description: 'Invoice ID' },
            amount: {
              type: 'number',
              exclusiveMinimum: 0,
              description: 'Positive payment amount in invoice currency',
            },
            paid_at: {
              type: 'string',
              format: 'date-time',
              description: 'Payment timestamp with time zone; choose this or paid_date',
            },
            paid_date: {
              type: 'string',
              format: 'date',
              description: 'Payment date YYYY-MM-DD; choose this or paid_at',
            },
            notes: { type: 'string', description: 'Optional payment notes' },
            send_thank_you: {
              type: 'boolean',
              default: false,
              description:
                'Send thank you email if Harvest is configured to do so and the invoice becomes fully paid',
            },
          },
          required: ['invoice_id', 'amount'],
          additionalProperties: false,
        },
      },
      handler: new RecordInvoicePaymentHandler(config),
    },
    {
      tool: {
        name: 'list_invoices',
        description: 'Retrieve invoices with optional filtering by client, project, state, and date ranges. Returns paginated results with complete invoice details.',
        inputSchema: {
          type: 'object',
          properties: {
            client_id: { type: 'number', description: 'Filter by client ID' },
            project_id: { type: 'number', description: 'Filter by project ID' },
            state: { type: 'string', enum: ['draft', 'open', 'paid', 'closed'], description: 'Filter by invoice state' },
            from: { type: 'string', format: 'date', description: 'Start date for date range filter (YYYY-MM-DD)' },
            to: { type: 'string', format: 'date', description: 'End date for date range filter (YYYY-MM-DD)' },
            updated_since: { type: 'string', format: 'date-time', description: 'Filter by invoices updated since this timestamp' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            per_page: { type: 'number', minimum: 1, maximum: 2000, description: 'Number of invoices per page (max 2000)' },
          },
          additionalProperties: false,
        },
      },
      handler: new ListInvoicesHandler(config),
    },
    {
      tool: {
        name: 'get_invoice',
        description: 'Retrieve a specific invoice by ID with complete details including line items, payments, and billing information.',
        inputSchema: {
          type: 'object',
          properties: {
            invoice_id: { type: 'number', description: 'The ID of the invoice to retrieve' },
          },
          required: ['invoice_id'],
          additionalProperties: false,
        },
      },
      handler: new GetInvoiceHandler(config),
    },
    {
      tool: {
        name: 'create_invoice',
        description: 'Create a new invoice for a client with optional line items and billing details. Supports custom terms, taxes, and payment configurations.',
        inputSchema: {
          type: 'object',
          properties: {
            client_id: { type: 'number', description: 'The client ID to invoice (required)' },
            subject: { type: 'string', description: 'Invoice subject line' },
            notes: { type: 'string', description: 'Invoice notes or description' },
            currency: { type: 'string', minLength: 3, maxLength: 3, description: '3-letter ISO currency code (e.g., USD, EUR)' },
            issue_date: { type: 'string', format: 'date', description: 'Invoice issue date (YYYY-MM-DD)' },
            due_date: { type: 'string', format: 'date', description: 'Invoice due date (YYYY-MM-DD)' },
            payment_term: { type: 'string', description: 'Payment terms (e.g., "Net 30")' },
            tax: { type: 'number', minimum: 0, maximum: 100, description: 'Tax percentage (0-100)' },
            tax2: { type: 'number', minimum: 0, maximum: 100, description: 'Second tax percentage (0-100)' },
            discount: { type: 'number', minimum: 0, maximum: 100, description: 'Discount percentage (0-100)' },
            purchase_order: { type: 'string', description: 'Client purchase order number' },
          },
          required: ['client_id'],
          additionalProperties: false,
        },
      },
      handler: new CreateInvoiceHandler(config),
    },
    {
      tool: {
        name: 'update_invoice',
        description: 'Update an existing invoice including subject, dates, terms, taxes, and other billing details. Only provided fields will be updated.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The ID of the invoice to update (required)' },
            client_id: { type: 'number', description: 'Update the client ID' },
            subject: { type: 'string', description: 'Update invoice subject' },
            notes: { type: 'string', description: 'Update invoice notes' },
            currency: { type: 'string', minLength: 3, maxLength: 3, description: 'Update currency code' },
            issue_date: { type: 'string', format: 'date', description: 'Update issue date' },
            due_date: { type: 'string', format: 'date', description: 'Update due date' },
            payment_term: { type: 'string', description: 'Update payment terms' },
            tax: { type: 'number', minimum: 0, maximum: 100, description: 'Update tax percentage' },
            tax2: { type: 'number', minimum: 0, maximum: 100, description: 'Update second tax percentage' },
            discount: { type: 'number', minimum: 0, maximum: 100, description: 'Update discount percentage' },
            purchase_order: { type: 'string', description: 'Update purchase order number' },
          },
          required: ['id'],
          additionalProperties: false,
        },
      },
      handler: new UpdateInvoiceHandler(config),
    },
    {
      tool: {
        name: 'delete_invoice',
        description: 'Delete an invoice permanently. This action cannot be undone and will remove all associated billing data.',
        inputSchema: {
          type: 'object',
          properties: {
            invoice_id: { type: 'number', description: 'The ID of the invoice to delete' },
          },
          required: ['invoice_id'],
          additionalProperties: false,
        },
      },
      handler: new DeleteInvoiceHandler(config),
    },
  ];
}