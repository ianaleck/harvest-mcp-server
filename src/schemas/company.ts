import { z } from 'zod';

// Company schema based on Harvest API v2 specification
export const CompanySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  is_active: z.boolean(),
  week_start_day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  wants_timestamp_timers: z.boolean(),
  time_format: z.enum(['decimal', 'hours_minutes']),
  plan_type: z.enum(['trial', 'free', 'simple', 'standard', 'pro']),
  clock: z.enum(['12h', '24h']),
  decimal_symbol: z.enum(['.', ',']),
  thousands_separator: z.enum(['.', ',', ' ', '']),
  color_scheme: z.enum(['orange', 'blue', 'green', 'red', 'yellow', 'purple']),
  weekly_capacity: z.number().min(0).max(168), // Max 168 hours per week
  expense_feature: z.boolean(),
  invoice_feature: z.boolean(),
  estimate_feature: z.boolean(),
  approval_feature: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Export the type
export type Company = z.infer<typeof CompanySchema>;

// Validation function
export function validateCompany(data: unknown): Company {
  return CompanySchema.parse(data);
}