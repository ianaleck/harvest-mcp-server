/**
 * Invoice Schemas for Harvest API v2
 * Comprehensive Zod schemas for invoice data validation and type safety  
 */

import { z } from 'zod';

// Invoice client reference
export const InvoiceClientSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  currency: z.string().length(3),
});

// Invoice line item schema
export const InvoiceLineItemSchema = z.object({
  id: z.number().int().positive(),
  kind: z.enum(['Service', 'Product']),
  description: z.string().nullable(),
  quantity: z.number().min(0),
  unit_price: z.number().min(0),
  amount: z.number().min(0),
  taxed: z.boolean(),
  taxed2: z.boolean(),
  project: z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    code: z.string().nullable(),
  }).nullable(),
});

// Main invoice schema
export const InvoiceSchema = z.object({
  id: z.number().int().positive(),
  client_key: z.string(),
  number: z.string().min(1),
  purchase_order: z.string().nullable(),
  amount: z.number().min(0),
  due_amount: z.number().min(0),
  tax: z.number().min(0).nullable(),
  tax_amount: z.number().min(0).nullable(),
  tax2: z.number().min(0).nullable(),
  tax2_amount: z.number().min(0).nullable(),
  discount: z.number().min(0).nullable(),
  discount_amount: z.number().min(0).nullable(),
  subject: z.string().nullable(),
  notes: z.string().nullable(),
  currency: z.string().length(3),
  state: z.enum(['draft', 'open', 'paid', 'closed']),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payment_term: z.string().nullable(),
  payment_options: z.array(z.string()),
  sent_at: z.string().datetime({ offset: true }).nullable(),
  paid_at: z.string().datetime({ offset: true }).nullable(),
  paid_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  closed_at: z.string().datetime({ offset: true }).nullable(),
  recurring_invoice_id: z.number().int().positive().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  client: InvoiceClientSchema,
  line_items: z.array(InvoiceLineItemSchema),
});

// Invoices list response (paginated)
export const InvoicesListSchema = z.object({
  invoices: z.array(InvoiceSchema),
  per_page: z.number().int().positive(),
  total_pages: z.number().int().min(0),
  total_entries: z.number().int().min(0),
  next_page: z.number().int().positive().nullable(),
  previous_page: z.number().int().positive().nullable(),
  page: z.number().int().positive(),
  links: z.object({
    first: z.string().url(),
    next: z.string().url().nullable(),
    previous: z.string().url().nullable(),
    last: z.string().url(),
  }),
});

// Input schemas for creating/updating invoices
export const CreateInvoiceSchema = z.object({
  client_id: z.number().int().positive(),
  subject: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().length(3).optional().default('USD'),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  payment_term: z.string().optional(),
  tax: z.number().min(0).max(100).optional(),
  tax2: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).max(100).optional(),
  purchase_order: z.string().optional(),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial().extend({
  id: z.number().int().positive(),
});

// Invoice line item input schemas
export const CreateInvoiceLineItemSchema = z.object({
  kind: z.enum(['Service', 'Product']).optional().default('Service'),
  description: z.string(),
  quantity: z.number().min(0).optional().default(1),
  unit_price: z.number().min(0),
  taxed: z.boolean().optional().default(false),
  taxed2: z.boolean().optional().default(false),
  project_id: z.number().int().positive().optional(),
});

// Query parameters for listing invoices
export const InvoiceQuerySchema = z.object({
  client_id: z.number().int().positive().optional(),
  project_id: z.number().int().positive().optional(),
  state: z.enum(['draft', 'open', 'paid', 'closed']).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  updated_since: z.string().datetime({ offset: true }).optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(2000).optional().default(2000),
});

// Type exports for use in other files
export type Invoice = z.infer<typeof InvoiceSchema>;
export type InvoicesList = z.infer<typeof InvoicesListSchema>;
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;
export type CreateInvoiceLineItemInput = z.infer<typeof CreateInvoiceLineItemSchema>;
export type InvoiceQuery = z.infer<typeof InvoiceQuerySchema>;