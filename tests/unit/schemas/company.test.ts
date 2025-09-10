/**
 * Company Schema Unit Tests
 */

// Set test environment variables before any imports
process.env.HARVEST_ACCESS_TOKEN = 'test_token_12345';
process.env.HARVEST_ACCOUNT_ID = '123456';

import { CompanySchema, validateCompany, type Company } from '../../../src/schemas/company';

describe('Company Schema', () => {
  const validCompanyData = {
    id: 1234567,
    name: 'Test Company',
    is_active: true,
    week_start_day: 'monday' as const,
    wants_timestamp_timers: false,
    time_format: 'decimal' as const,
    plan_type: 'standard' as const,
    clock: '24h' as const,
    decimal_symbol: '.' as const,
    thousands_separator: ',' as const,
    color_scheme: 'blue' as const,
    weekly_capacity: 40,
    expense_feature: true,
    invoice_feature: true,
    estimate_feature: true,
    approval_feature: false,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  describe('CompanySchema', () => {
    it('should validate valid company data', () => {
      const result = CompanySchema.parse(validCompanyData);
      
      expect(result).toEqual(validCompanyData);
      expect(result.id).toBe(1234567);
      expect(result.name).toBe('Test Company');
      expect(result.is_active).toBe(true);
    });

    it('should reject invalid company data', () => {
      const invalidData = {
        ...validCompanyData,
        id: 'invalid', // Should be number
        week_start_day: 'invalid_day', // Invalid enum value
      };

      expect(() => CompanySchema.parse(invalidData)).toThrow();
    });
  });

  describe('validateCompany function', () => {
    it('should validate and return valid company data', () => {
      const result = validateCompany(validCompanyData);
      
      expect(result).toEqual(validCompanyData);
      expect(result.id).toBe(1234567);
      expect(result.name).toBe('Test Company');
    });

    it('should throw error for invalid company data', () => {
      const invalidData = {
        ...validCompanyData,
        id: null, // Invalid - should be positive number
        name: '', // Invalid - should be min 1 char
      };

      expect(() => validateCompany(invalidData)).toThrow();
    });

    it('should throw error for missing required fields', () => {
      const incompleteData = {
        id: 123,
        name: 'Test',
        // Missing many required fields
      };

      expect(() => validateCompany(incompleteData)).toThrow();
    });

    it('should validate enum fields correctly', () => {
      // Test all enum values work
      const testData = {
        ...validCompanyData,
        week_start_day: 'sunday' as const,
        time_format: 'hours_minutes' as const,
        plan_type: 'pro' as const,
        clock: '12h' as const,
        decimal_symbol: ',' as const,
        thousands_separator: ' ' as const,
        color_scheme: 'red' as const,
      };

      const result = validateCompany(testData);
      expect(result.week_start_day).toBe('sunday');
      expect(result.time_format).toBe('hours_minutes');
      expect(result.plan_type).toBe('pro');
      expect(result.clock).toBe('12h');
      expect(result.decimal_symbol).toBe(',');
      expect(result.thousands_separator).toBe(' ');
      expect(result.color_scheme).toBe('red');
    });

    it('should validate weekly_capacity bounds', () => {
      // Valid capacity
      expect(() => validateCompany({
        ...validCompanyData,
        weekly_capacity: 168 // Max allowed
      })).not.toThrow();

      expect(() => validateCompany({
        ...validCompanyData,
        weekly_capacity: 0 // Min allowed
      })).not.toThrow();

      // Invalid capacity (too high)
      expect(() => validateCompany({
        ...validCompanyData,
        weekly_capacity: 169 // Over max
      })).toThrow();

      // Invalid capacity (negative)
      expect(() => validateCompany({
        ...validCompanyData,
        weekly_capacity: -1 // Below min
      })).toThrow();
    });
  });

  describe('TypeScript types', () => {
    it('should infer correct Company type', () => {
      const company: Company = validCompanyData;
      
      // TypeScript should enforce the correct types
      expect(typeof company.id).toBe('number');
      expect(typeof company.name).toBe('string');
      expect(typeof company.is_active).toBe('boolean');
      expect(typeof company.weekly_capacity).toBe('number');
    });
  });
});