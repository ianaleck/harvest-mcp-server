/**
 * Client Schemas for Harvest API v2
 * Comprehensive Zod schemas for client data validation and type safety
 */

import { z } from 'zod';

// Main client schema
export const ClientSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  is_active: z.boolean(),
  address: z.string().nullable(),
  statement_key: z.string().nullable(),
  currency: z.string().length(3).optional(), // ISO currency code
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

// Clients list response (paginated)
export const ClientsListSchema = z.object({
  clients: z.array(ClientSchema),
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

// Input schemas for creating/updating clients
export const CreateClientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  is_active: z.boolean().optional().default(true),
  address: z.string().optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code').optional().default('USD'),
});

export const UpdateClientSchema = CreateClientSchema.partial().extend({
  id: z.number().int().positive(),
});

// Query parameters for listing clients
export const ClientQuerySchema = z.object({
  is_active: z.boolean().optional(),
  updated_since: z.string().datetime({ offset: true }).optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(2000).optional().default(2000),
});

// Type exports for use in other files
export type Client = z.infer<typeof ClientSchema>;
export type ClientsList = z.infer<typeof ClientsListSchema>;
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type ClientQuery = z.infer<typeof ClientQuerySchema>;