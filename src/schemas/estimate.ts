/**
 * Estimate Schemas for Harvest API v2
 * Comprehensive Zod schemas for estimate data validation and type safety
 */

import { z } from 'zod';

// Estimate client reference
export const EstimateClientSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  currency: z.string().length(3),
});

// Estimate line item schema
export const EstimateLineItemSchema = z.object({
  id: z.number().int().positive(),
  kind: z.enum(['Service', 'Product']),
  description: z.string().nullable(),
  quantity: z.number().min(0),
  unit_price: z.number().min(0),
  amount: z.number().min(0),
  taxed: z.boolean(),
  taxed2: z.boolean(),
});

// Estimate creator/assignee schema
export const EstimatePersonSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
});

// Main estimate schema
export const EstimateSchema = z.object({
  id: z.number().int().positive(),
  client_key: z.string(),
  number: z.string().min(1),
  purchase_order: z.string().nullable(),
  amount: z.number().min(0),
  tax: z.number().min(0).nullable(),
  tax_amount: z.number().min(0).nullable(),
  tax2: z.number().min(0).nullable(),
  tax2_amount: z.number().min(0).nullable(),
  discount: z.number().min(0).nullable(),
  discount_amount: z.number().min(0).nullable(),
  subject: z.string().nullable(),
  notes: z.string().nullable(),
  currency: z.string().length(3),
  state: z.enum(['draft', 'sent', 'accepted', 'declined']),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sent_at: z.string().datetime({ offset: true }).nullable(),
  accepted_at: z.string().datetime({ offset: true }).nullable(),
  declined_at: z.string().datetime({ offset: true }).nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  client: EstimateClientSchema,
  creator: EstimatePersonSchema,
  line_items: z.array(EstimateLineItemSchema),
});

// Estimates list response (paginated)
export const EstimatesListSchema = z.object({
  estimates: z.array(EstimateSchema),
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

// Input schemas for creating/updating estimates
export const CreateEstimateSchema = z.object({
  client_id: z.number().int().positive(),
  subject: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().length(3).optional().default('USD'),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  tax: z.number().min(0).max(100).optional(),
  tax2: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).max(100).optional(),
  purchase_order: z.string().optional(),
});

export const UpdateEstimateSchema = CreateEstimateSchema.partial().extend({
  id: z.number().int().positive(),
});

// Estimate line item input schemas
export const CreateEstimateLineItemSchema = z.object({
  kind: z.enum(['Service', 'Product']).optional().default('Service'),
  description: z.string(),
  quantity: z.number().min(0).optional().default(1),
  unit_price: z.number().min(0),
  taxed: z.boolean().optional().default(false),
  taxed2: z.boolean().optional().default(false),
});

// Estimate item categories for services/products
export const EstimateItemCategorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  use_as_service: z.boolean(),
  use_as_expense: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const EstimateItemCategoriesListSchema = z.object({
  estimate_item_categories: z.array(EstimateItemCategorySchema),
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

// Query parameters for listing estimates
export const EstimateQuerySchema = z.object({
  client_id: z.number().int().positive().optional(),
  state: z.enum(['draft', 'sent', 'accepted', 'declined']).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  updated_since: z.string().datetime({ offset: true }).optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(2000).optional().default(2000),
});

// Estimate action schemas (send, accept, decline)
export const SendEstimateSchema = z.object({
  id: z.number().int().positive(),
  event_type: z.literal('send'),
});

export const AcceptEstimateSchema = z.object({
  id: z.number().int().positive(),
  event_type: z.literal('accept'),
});

export const DeclineEstimateSchema = z.object({
  id: z.number().int().positive(),
  event_type: z.literal('decline'),
});

// Type exports for use in other files
export type Estimate = z.infer<typeof EstimateSchema>;
export type EstimatesList = z.infer<typeof EstimatesListSchema>;
export type CreateEstimateInput = z.infer<typeof CreateEstimateSchema>;
export type UpdateEstimateInput = z.infer<typeof UpdateEstimateSchema>;
export type EstimateLineItem = z.infer<typeof EstimateLineItemSchema>;
export type CreateEstimateLineItemInput = z.infer<typeof CreateEstimateLineItemSchema>;
export type EstimateItemCategory = z.infer<typeof EstimateItemCategorySchema>;
export type EstimateItemCategoriesList = z.infer<typeof EstimateItemCategoriesListSchema>;
export type EstimateQuery = z.infer<typeof EstimateQuerySchema>;
export type SendEstimateInput = z.infer<typeof SendEstimateSchema>;
export type AcceptEstimateInput = z.infer<typeof AcceptEstimateSchema>;
export type DeclineEstimateInput = z.infer<typeof DeclineEstimateSchema>;