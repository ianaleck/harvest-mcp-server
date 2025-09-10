/**
 * Report Schemas for Harvest API v2
 * Comprehensive Zod schemas for report data validation and type safety
 */

import { z } from 'zod';

// Base report result schemas
export const TimeReportResultSchema = z.object({
  user_id: z.number().int().positive(),
  user_name: z.string().min(1),
  client_id: z.number().int().positive().nullable(),
  client_name: z.string().nullable(),
  project_id: z.number().int().positive().nullable(),
  project_name: z.string().nullable(),
  task_id: z.number().int().positive().nullable(),
  task_name: z.string().nullable(),
  total_hours: z.number().min(0),
  billable_hours: z.number().min(0),
  currency: z.string().length(3),
  billable_amount: z.number().min(0),
});

export const ExpenseReportResultSchema = z.object({
  user_id: z.number().int().positive(),
  user_name: z.string().min(1),
  client_id: z.number().int().positive().nullable(),
  client_name: z.string().nullable(),
  project_id: z.number().int().positive().nullable(),
  project_name: z.string().nullable(),
  expense_category_id: z.number().int().positive(),
  expense_category_name: z.string().min(1),
  total_amount: z.number().min(0),
  billable_amount: z.number().min(0),
  currency: z.string().length(3),
});

// Time reports schema
export const TimeReportSchema = z.object({
  results: z.array(TimeReportResultSchema),
  total_hours: z.number().min(0),
  total_billable_hours: z.number().min(0),
  total_amount: z.number().min(0),
  total_billable_amount: z.number().min(0),
  currency: z.string().length(3),
});

// Expense reports schema
export const ExpenseReportSchema = z.object({
  results: z.array(ExpenseReportResultSchema),
  total_amount: z.number().min(0),
  total_billable_amount: z.number().min(0),
  currency: z.string().length(3),
});

// Project budget report schema
export const ProjectBudgetReportSchema = z.object({
  client_id: z.number().int().positive(),
  client_name: z.string().min(1),
  project_id: z.number().int().positive(),
  project_name: z.string().min(1),
  project_code: z.string().nullable(),
  budget_hours: z.number().min(0).nullable(),
  budget_amount: z.number().min(0).nullable(),
  budget_by: z.enum(['project', 'project_cost', 'task', 'person', 'none']),
  is_active: z.boolean(),
  over_budget: z.boolean(),
  spent_hours: z.number().min(0),
  spent_amount: z.number().min(0),
  remaining_hours: z.number().nullable(),
  remaining_amount: z.number().nullable(),
  currency: z.string().length(3),
});

export const ProjectBudgetReportsSchema = z.object({
  results: z.array(ProjectBudgetReportSchema),
});

// Uninvoiced report schema
export const UninvoicedReportSchema = z.object({
  client_id: z.number().int().positive(),
  client_name: z.string().min(1),
  project_id: z.number().int().positive(),
  project_name: z.string().min(1),
  uninvoiced_hours: z.number().min(0),
  uninvoiced_expenses: z.number().min(0),
  uninvoiced_amount: z.number().min(0),
  currency: z.string().length(3),
});

export const UninvoicedReportsSchema = z.object({
  results: z.array(UninvoicedReportSchema),
  total_hours: z.number().min(0),
  total_expenses: z.number().min(0),
  total_amount: z.number().min(0),
  currency: z.string().length(3),
});

// Team time report schema (detailed breakdown)
export const TeamTimeReportResultSchema = z.object({
  user_id: z.number().int().positive(),
  user_name: z.string().min(1),
  is_contractor: z.boolean(),
  total_hours: z.number().min(0),
  entries: z.array(z.object({
    project_id: z.number().int().positive(),
    project_name: z.string().min(1),
    client_name: z.string().min(1),
    task_id: z.number().int().positive(),
    task_name: z.string().min(1),
    hours: z.number().min(0),
    billable_hours: z.number().min(0),
    amount: z.number().min(0),
    billable_amount: z.number().min(0),
    currency: z.string().length(3),
  }))
});

export const TeamTimeReportSchema = z.object({
  results: z.array(TeamTimeReportResultSchema),
  total_hours: z.number().min(0),
  total_billable_hours: z.number().min(0),
  total_amount: z.number().min(0),
  total_billable_amount: z.number().min(0),
  currency: z.string().length(3),
});

// Query parameters for time reports
export const TimeReportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  user_id: z.number().int().positive().optional(),
  client_id: z.number().int().positive().optional(),
  project_id: z.number().int().positive().optional(),
  task_id: z.number().int().positive().optional(),
  billable: z.boolean().optional(),
  is_billed: z.boolean().optional(),
  is_running: z.boolean().optional(),
  updated_since: z.string().datetime({ offset: true }).optional(),
  group_by: z.enum(['user', 'client', 'project', 'task', 'date']).optional(),
});

// Query parameters for expense reports
export const ExpenseReportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  user_id: z.number().int().positive().optional(),
  client_id: z.number().int().positive().optional(),
  project_id: z.number().int().positive().optional(),
  expense_category_id: z.number().int().positive().optional(),
  billable: z.boolean().optional(),
  is_billed: z.boolean().optional(),
  updated_since: z.string().datetime({ offset: true }).optional(),
  group_by: z.enum(['user', 'client', 'project', 'expense_category', 'date']).optional(),
});

// Query parameters for project budget reports
export const ProjectBudgetReportQuerySchema = z.object({
  is_active: z.boolean().optional(),
  client_id: z.number().int().positive().optional(),
  over_budget: z.boolean().optional(),
});

// Query parameters for uninvoiced reports
export const UninvoicedReportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  client_id: z.number().int().positive().optional(),
  project_id: z.number().int().positive().optional(),
});

// Type exports for use in other files
export type TimeReport = z.infer<typeof TimeReportSchema>;
export type ExpenseReport = z.infer<typeof ExpenseReportSchema>;
export type ProjectBudgetReport = z.infer<typeof ProjectBudgetReportSchema>;
export type ProjectBudgetReports = z.infer<typeof ProjectBudgetReportsSchema>;
export type UninvoicedReport = z.infer<typeof UninvoicedReportSchema>;
export type UninvoicedReports = z.infer<typeof UninvoicedReportsSchema>;
export type TeamTimeReport = z.infer<typeof TeamTimeReportSchema>;
export type TimeReportQuery = z.infer<typeof TimeReportQuerySchema>;
export type ExpenseReportQuery = z.infer<typeof ExpenseReportQuerySchema>;
export type ProjectBudgetReportQuery = z.infer<typeof ProjectBudgetReportQuerySchema>;
export type UninvoicedReportQuery = z.infer<typeof UninvoicedReportQuerySchema>;