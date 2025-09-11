/**
 * Project Schemas for Harvest API v2
 * Comprehensive Zod schemas for project data validation and type safety
 */

import { z } from 'zod';

// Project client reference
export const ProjectClientSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  currency: z.string().length(3).optional(), // ISO currency code
});

// Main project schema
export const ProjectSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  code: z.string().nullable(),
  is_active: z.boolean(),
  is_billable: z.boolean(),
  is_fixed_fee: z.boolean(),
  bill_by: z.enum(['Project', 'Tasks', 'People', 'none']),
  hourly_rate: z.number().min(0).nullable(),
  budget: z.number().min(0).nullable(),
  budget_by: z.enum(['project', 'project_cost', 'task', 'task_fees', 'person', 'none']).nullable(),
  budget_is_monthly: z.boolean().optional(),
  notify_when_over_budget: z.boolean().optional(),
  over_budget_notification_percentage: z.number().min(0).max(100).nullable(),
  over_budget_notification_date: z.string().datetime({ offset: true }).nullable(),
  show_budget_to_all: z.boolean().optional(),
  cost_budget: z.number().min(0).nullable(),
  cost_budget_include_expenses: z.boolean().optional(),
  fee: z.number().min(0).nullable(),
  notes: z.string().nullable(),
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), // Date in YYYY-MM-DD format
  ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), // Date in YYYY-MM-DD format
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  client: ProjectClientSchema,
});

// Projects list response (paginated)
export const ProjectsListSchema = z.object({
  projects: z.array(ProjectSchema),
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

// Input schemas for creating/updating projects
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  client_id: z.number().int().positive(),
  code: z.string().optional(),
  is_active: z.boolean().optional().default(true),
  is_billable: z.boolean().optional().default(true),
  is_fixed_fee: z.boolean().optional().default(false),
  bill_by: z.enum(['Project', 'Tasks', 'People', 'none']).optional().default('none'),
  hourly_rate: z.number().min(0).optional(),
  budget: z.number().min(0).optional(),
  budget_by: z.enum(['project', 'project_cost', 'task', 'task_fees', 'person', 'none']).optional(),
  budget_is_monthly: z.boolean().optional().default(false),
  notify_when_over_budget: z.boolean().optional().default(false),
  over_budget_notification_percentage: z.number().min(0).max(100).optional(),
  show_budget_to_all: z.boolean().optional().default(false),
  cost_budget: z.number().min(0).optional(),
  cost_budget_include_expenses: z.boolean().optional().default(false),
  fee: z.number().min(0).optional(),
  notes: z.string().optional(),
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  id: z.number().int().positive(),
});

// Query parameters for listing projects
export const ProjectQuerySchema = z.object({
  is_active: z.boolean().optional(),
  client_id: z.number().int().positive().optional(),
  updated_since: z.string().datetime({ offset: true }).optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(2000).optional().default(2000),
});

// Type exports for use in other files
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectsList = z.infer<typeof ProjectsListSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type ProjectQuery = z.infer<typeof ProjectQuerySchema>;