/**
 * Time Entry Schemas for Harvest API v2
 * Comprehensive Zod schemas for time entry data validation and type safety
 */

import { z } from 'zod';

// Time entry user reference
export const TimeEntryUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email().optional(),
});

// Time entry project reference
export const TimeEntryProjectSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  code: z.string().optional(),
});

// Time entry task reference
export const TimeEntryTaskSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
});

// Time entry client reference
export const TimeEntryClientSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  currency: z.string().length(3).optional(), // ISO currency code
});

// Time entry invoice reference (optional)
export const TimeEntryInvoiceSchema = z.object({
  id: z.number().int().positive(),
  number: z.string().min(1),
}).nullable();

// External reference for integrations
export const TimeEntryExternalReferenceSchema = z.object({
  id: z.string().optional(),
  group_id: z.string().optional(),
  account_id: z.string().optional(),
  permalink: z.string().url().optional(),
}).nullable();

// Main time entry schema
export const TimeEntrySchema = z.object({
  id: z.number().int().positive(),
  spent_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  hours: z.number().min(0).max(24), // Decimal hours (0.5 = 30min, 1.25 = 1h15m)
  hours_without_timer: z.number().min(0).max(24).optional(),
  rounded_hours: z.number().min(0).max(24).optional(),
  notes: z.string().nullable(),
  is_locked: z.boolean().optional(),
  locked_reason: z.string().nullable(),
  is_closed: z.boolean().optional(),
  is_billed: z.boolean().optional(),
  timer_started_at: z.string().datetime({ offset: true }).nullable(),
  started_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable(), // HH:MM format
  ended_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable(), // HH:MM format
  is_running: z.boolean().optional(),
  billable: z.boolean().optional(),
  budgeted: z.boolean().optional(),
  billable_rate: z.number().min(0).nullable(),
  cost_rate: z.number().min(0).nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  user: TimeEntryUserSchema,
  project: TimeEntryProjectSchema,
  task: TimeEntryTaskSchema,
  client: TimeEntryClientSchema,
  invoice: TimeEntryInvoiceSchema,
  external_reference: TimeEntryExternalReferenceSchema,
});

// Time entries list response (paginated)
export const TimeEntriesListSchema = z.object({
  time_entries: z.array(TimeEntrySchema),
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

// Input schemas for creating/updating time entries
export const CreateTimeEntrySchema = z.object({
  project_id: z.number().int().positive(),
  task_id: z.number().int().positive(),
  spent_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  started_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM
  ended_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM
  hours: z.number().min(0).max(24).optional(), // Either hours or start/end time
  notes: z.string().max(2000).optional(), // Harvest has a notes limit
  external_reference: z.object({
    id: z.string().optional(),
    group_id: z.string().optional(),
    account_id: z.string().optional(),
    permalink: z.string().url().optional(),
  }).optional(),
}).refine((data) => {
  // Must have either hours or both start/end times
  const hasHours = data.hours !== undefined && data.hours > 0;
  const hasTimes = data.started_time && data.ended_time;
  return hasHours || hasTimes;
}, {
  message: "Must provide either 'hours' or both 'started_time' and 'ended_time'",
});

// For updates, we need to work around the refined schema
const BaseCreateTimeEntrySchema = z.object({
  project_id: z.number().int().positive(),
  task_id: z.number().int().positive(),
  spent_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  started_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  ended_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  hours: z.number().min(0).max(24).optional(),
  notes: z.string().max(2000).optional(),
  external_reference: z.object({
    id: z.string().optional(),
    group_id: z.string().optional(),
    account_id: z.string().optional(),
    permalink: z.string().url().optional(),
  }).optional(),
});

export const UpdateTimeEntrySchema = BaseCreateTimeEntrySchema.partial().extend({
  id: z.number().int().positive(),
});

// Query parameters for listing time entries
export const TimeEntryQuerySchema = z.object({
  user_id: z.number().int().positive().optional(),
  client_id: z.number().int().positive().optional(),
  project_id: z.number().int().positive().optional(),
  task_id: z.number().int().positive().optional(),
  is_billed: z.boolean().optional(),
  is_running: z.boolean().optional(),
  updated_since: z.string().datetime({ offset: true }).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // Date range start
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // Date range end
  page: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(2000).optional().default(2000),
});

// Timer operation schemas
export const StartTimerSchema = z.object({
  project_id: z.number().int().positive(),
  task_id: z.number().int().positive(),
  spent_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().max(2000).optional(),
  external_reference: z.object({
    id: z.string().optional(),
    group_id: z.string().optional(),
    account_id: z.string().optional(),
    permalink: z.string().url().optional(),
  }).optional(),
});

export const StopTimerSchema = z.object({
  id: z.number().int().positive(), // Time entry ID
});

export const RestartTimerSchema = z.object({
  id: z.number().int().positive(), // Time entry ID to restart
});

// Type exports for use in other files
export type TimeEntry = z.infer<typeof TimeEntrySchema>;
export type TimeEntriesList = z.infer<typeof TimeEntriesListSchema>;
export type CreateTimeEntryInput = z.infer<typeof CreateTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof UpdateTimeEntrySchema>;
export type TimeEntryQuery = z.infer<typeof TimeEntryQuerySchema>;
export type StartTimerInput = z.infer<typeof StartTimerSchema>;
export type StopTimerInput = z.infer<typeof StopTimerSchema>;
export type RestartTimerInput = z.infer<typeof RestartTimerSchema>;