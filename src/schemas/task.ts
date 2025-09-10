/**
 * Task Schemas for Harvest API v2
 * Comprehensive Zod schemas for task data validation and type safety
 */

import { z } from 'zod';

// Main task schema
export const TaskSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  billable_by_default: z.boolean(),
  default_hourly_rate: z.number().min(0).nullable(),
  is_default: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

// Tasks list response (paginated)
export const TasksListSchema = z.object({
  tasks: z.array(TaskSchema),
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

// Task assignment to project schema (for project-specific task operations)
export const ProjectTaskAssignmentSchema = z.object({
  id: z.number().int().positive(),
  billable: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  hourly_rate: z.number().min(0).nullable(),
  budget: z.number().min(0).nullable(),
  task: TaskSchema,
});

// Project task assignments list response
export const ProjectTaskAssignmentsListSchema = z.object({
  task_assignments: z.array(ProjectTaskAssignmentSchema),
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

// Input schemas for creating/updating tasks
export const CreateTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  billable_by_default: z.boolean().optional().default(true),
  default_hourly_rate: z.number().min(0).optional(),
  is_default: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  id: z.number().int().positive(),
});

// Create/Update project task assignment
export const CreateProjectTaskAssignmentSchema = z.object({
  project_id: z.number().int().positive(),
  task_id: z.number().int().positive(),
  is_active: z.boolean().optional().default(true),
  billable: z.boolean().optional().default(true),
  hourly_rate: z.number().min(0).optional(),
  budget: z.number().min(0).optional(),
});

export const UpdateProjectTaskAssignmentSchema = CreateProjectTaskAssignmentSchema.partial().extend({
  project_id: z.number().int().positive(),
  id: z.number().int().positive(),
});

// Query parameters for listing tasks
export const TaskQuerySchema = z.object({
  is_active: z.boolean().optional(),
  updated_since: z.string().datetime({ offset: true }).optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(2000).optional().default(2000),
});

// Query parameters for listing project task assignments
export const ProjectTaskAssignmentQuerySchema = z.object({
  project_id: z.number().int().positive(),
  is_active: z.boolean().optional(),
  updated_since: z.string().datetime({ offset: true }).optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(2000).optional().default(2000),
});

// Type exports for use in other files
export type Task = z.infer<typeof TaskSchema>;
export type TasksList = z.infer<typeof TasksListSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskQuery = z.infer<typeof TaskQuerySchema>;

export type ProjectTaskAssignment = z.infer<typeof ProjectTaskAssignmentSchema>;
export type ProjectTaskAssignmentsList = z.infer<typeof ProjectTaskAssignmentsListSchema>;
export type CreateProjectTaskAssignmentInput = z.infer<typeof CreateProjectTaskAssignmentSchema>;
export type UpdateProjectTaskAssignmentInput = z.infer<typeof UpdateProjectTaskAssignmentSchema>;
export type ProjectTaskAssignmentQuery = z.infer<typeof ProjectTaskAssignmentQuerySchema>;