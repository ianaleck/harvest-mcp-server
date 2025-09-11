/**
 * User Schemas for Harvest API v2  
 * Comprehensive Zod schemas for user data validation and type safety
 */

import { z } from 'zod';

// Main user schema
export const UserSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  telephone: z.string(),
  timezone: z.string(),
  has_access_to_all_future_projects: z.boolean(),
  is_contractor: z.boolean(),
  is_active: z.boolean(),
  weekly_capacity: z.number().int().min(0), // in seconds
  default_hourly_rate: z.number().min(0).optional(),
  cost_rate: z.number().min(0).optional(),
  roles: z.array(z.string()),
  access_roles: z.array(z.string()),
  avatar_url: z.string().url().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

// Users list response (paginated)
export const UsersListSchema = z.object({
  users: z.array(UserSchema),
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

// Input schemas for creating/updating users
export const CreateUserSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  telephone: z.string().optional(),
  timezone: z.string().optional().default('UTC'),
  has_access_to_all_future_projects: z.boolean().optional().default(false),
  is_contractor: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  weekly_capacity: z.number().int().min(0).optional().default(144000), // 40 hours in seconds
  default_hourly_rate: z.number().min(0).optional(),
  cost_rate: z.number().min(0).optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial().extend({
  id: z.number().int().positive(),
});

// Query parameters for listing users
export const UserQuerySchema = z.object({
  is_active: z.boolean().optional(),
  updated_since: z.string().datetime({ offset: true }).optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(2000).optional().default(2000),
});

// Type exports for use in other files
export type User = z.infer<typeof UserSchema>;
export type UsersList = z.infer<typeof UsersListSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;