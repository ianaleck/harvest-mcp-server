/**
 * Expense Schemas for Harvest API v2
 * Comprehensive Zod schemas for expense data validation and type safety
 */

import { z } from 'zod';

// Expense category schema
export const ExpenseCategorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  unit_name: z.string().nullable(),
  unit_price: z.number().min(0).nullable(),
  is_active: z.boolean(),
});

// Expense client reference
export const ExpenseClientSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  currency: z.string().length(3),
});

// Expense project reference
export const ExpenseProjectSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  code: z.string().nullable(),
});

// Expense user reference
export const ExpenseUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
});

// Expense receipt schema
export const ExpenseReceiptSchema = z.object({
  url: z.string().url(),
  file_name: z.string().min(1),
  file_size: z.number().int().positive(),
  content_type: z.string().min(1),
});

// Main expense schema
export const ExpenseSchema = z.object({
  id: z.number().int().positive(),
  spent_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().nullable(),
  total_cost: z.number().min(0),
  units: z.number().min(0).nullable(),
  is_closed: z.boolean(),
  is_locked: z.boolean(),
  is_billed: z.boolean(),
  locked_reason: z.string().nullable(),
  billable: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  user: ExpenseUserSchema,
  user_assignment: z.object({
    id: z.number().int().positive(),
    is_project_manager: z.boolean(),
    is_active: z.boolean(),
    budget: z.number().min(0).nullable(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    hourly_rate: z.number().min(0).nullable(),
  }),
  expense_category: ExpenseCategorySchema,
  client: ExpenseClientSchema,
  project: ExpenseProjectSchema,
  invoice: z.object({
    id: z.number().int().positive(),
    number: z.string().min(1),
  }).nullable(),
  receipt: ExpenseReceiptSchema.nullable(),
});

// Expenses list response (paginated)
export const ExpensesListSchema = z.object({
  expenses: z.array(ExpenseSchema),
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

// Input schemas for creating/updating expenses
export const CreateExpenseSchema = z.object({
  user_id: z.number().int().positive().optional(),
  project_id: z.number().int().positive(),
  expense_category_id: z.number().int().positive(),
  spent_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().optional(),
  total_cost: z.number().min(0),
  units: z.number().min(0).optional(),
  billable: z.boolean().optional().default(true),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial().extend({
  id: z.number().int().positive(),
});

// Expense categories schemas
export const ExpenseCategoriesListSchema = z.object({
  expense_categories: z.array(ExpenseCategorySchema),
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

// Input schemas for creating/updating expense categories
export const CreateExpenseCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  unit_name: z.string().optional(),
  unit_price: z.number().min(0).optional(),
  is_active: z.boolean().optional().default(true),
});

export const UpdateExpenseCategorySchema = CreateExpenseCategorySchema.partial().extend({
  id: z.number().int().positive(),
});

// Query parameters for listing expenses
export const ExpenseQuerySchema = z.object({
  user_id: z.number().int().positive().optional(),
  client_id: z.number().int().positive().optional(),
  project_id: z.number().int().positive().optional(),
  is_billed: z.boolean().optional(),
  is_closed: z.boolean().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  updated_since: z.string().datetime({ offset: true }).optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(2000).optional().default(2000),
});

// Query parameters for listing expense categories
export const ExpenseCategoryQuerySchema = z.object({
  is_active: z.boolean().optional(),
  updated_since: z.string().datetime({ offset: true }).optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(2000).optional().default(2000),
});

// Type exports for use in other files
export type Expense = z.infer<typeof ExpenseSchema>;
export type ExpensesList = z.infer<typeof ExpensesListSchema>;
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;
export type ExpenseCategoriesList = z.infer<typeof ExpenseCategoriesListSchema>;
export type CreateExpenseCategoryInput = z.infer<typeof CreateExpenseCategorySchema>;
export type UpdateExpenseCategoryInput = z.infer<typeof UpdateExpenseCategorySchema>;
export type ExpenseQuery = z.infer<typeof ExpenseQuerySchema>;
export type ExpenseCategoryQuery = z.infer<typeof ExpenseCategoryQuerySchema>;