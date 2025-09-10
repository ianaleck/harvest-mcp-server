/**
 * Custom Jest matchers for Harvest API data validation
 * Provides semantic, domain-specific assertions for Harvest entities
 */

import { expect } from '@jest/globals';

// Custom matcher implementations
const harvestMatchers = {
  /**
   * Validates a Harvest ID (positive integer)
   * Usage: expect(company.id).toHaveValidHarvestId()
   */
  toHaveValidHarvestId(received: any) {
    const pass = typeof received === 'number' && received > 0 && Number.isInteger(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid Harvest ID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid Harvest ID (positive integer), but received ${typeof received === 'number' ? received : `${typeof received}: ${received}`}`,
        pass: false,
      };
    }
  },

  /**
   * Validates a date string in YYYY-MM-DD format
   * Usage: expect(timeEntry.spent_date).toBeValidDateString()
   */
  toBeValidDateString(received: any) {
    const pass = typeof received === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(received);
    if (pass) {
      // Additional validation: check if it's a real date
      const date = new Date(received);
      const isValidDate = !isNaN(date.getTime()) && received === date.toISOString().split('T')[0];
      if (isValidDate) {
        return {
          message: () => `expected ${received} not to be a valid date string`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be a valid date string (YYYY-MM-DD format with valid date)`,
          pass: false,
        };
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid date string (YYYY-MM-DD format), but received ${typeof received}: ${received}`,
        pass: false,
      };
    }
  },

  /**
   * Validates a time string in HH:MM format (24-hour)
   * Usage: expect(timeEntry.started_time).toBeValidTimeString()
   */
  toBeValidTimeString(received: any) {
    const pass = typeof received === 'string' && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid time string`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid time string (HH:MM in 24-hour format), but received ${typeof received}: ${received}`,
        pass: false,
      };
    }
  },

  /**
   * Validates a money amount (non-negative with max 2 decimal places)
   * Usage: expect(invoice.amount).toHaveValidMoneyAmount()
   */
  toHaveValidMoneyAmount(received: any) {
    const pass = typeof received === 'number' && 
                 received >= 0 && 
                 Math.round(received * 100) === received * 100;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid money amount`,
        pass: true,
      };
    } else {
      let reason = '';
      if (typeof received !== 'number') {
        reason = `expected number, received ${typeof received}`;
      } else if (received < 0) {
        reason = 'money amounts cannot be negative';
      } else {
        reason = 'money amounts cannot have more than 2 decimal places';
      }
      return {
        message: () => `expected ${received} to be a valid money amount (non-negative number with max 2 decimal places): ${reason}`,
        pass: false,
      };
    }
  },

  /**
   * Validates decimal hours (0-24, where 0.5 = 30min, 1.25 = 1h15m)
   * Usage: expect(timeEntry.hours).toBeValidDecimalHours()
   */
  toBeValidDecimalHours(received: any) {
    const pass = typeof received === 'number' && received >= 0 && received <= 24;
    if (pass) {
      return {
        message: () => `expected ${received} not to be valid decimal hours`,
        pass: true,
      };
    } else {
      let reason = '';
      if (typeof received !== 'number') {
        reason = `expected number, received ${typeof received}`;
      } else if (received < 0) {
        reason = 'hours cannot be negative';
      } else {
        reason = 'hours cannot exceed 24 in a day';
      }
      return {
        message: () => `expected ${received} to be valid decimal hours (0-24, e.g., 0.5 = 30min, 1.25 = 1h15m): ${reason}`,
        pass: false,
      };
    }
  },

  /**
   * Validates a number is within a range (inclusive)
   * Usage: expect(percentage).toBeWithinRange(0, 100)
   */
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = typeof received === 'number' && received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      let reason = '';
      if (typeof received !== 'number') {
        reason = `expected number, received ${typeof received}`;
      } else {
        reason = `${received} is outside the range ${floor} - ${ceiling}`;
      }
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}: ${reason}`,
        pass: false,
      };
    }
  },

  /**
   * Validates an email address format
   * Usage: expect(user.email).toBeValidEmail()
   */
  toBeValidEmail(received: any) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email address`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email address, but received ${typeof received}: ${received}`,
        pass: false,
      };
    }
  },

  /**
   * Validates a Harvest currency code (3-letter ISO)
   * Usage: expect(client.currency).toBeValidCurrencyCode()
   */
  toBeValidCurrencyCode(received: any) {
    const currencyRegex = /^[A-Z]{3}$/;
    const pass = typeof received === 'string' && currencyRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid currency code`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid 3-letter currency code (e.g., USD, EUR), but received ${typeof received}: ${received}`,
        pass: false,
      };
    }
  },
};

// Extend Jest's expect with custom matchers
expect.extend(harvestMatchers);

// TypeScript declarations for the custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Validates that the received value is a valid Harvest ID (positive integer)
       */
      toHaveValidHarvestId(): R;
      
      /**
       * Validates that the received value is a valid date string (YYYY-MM-DD)
       */
      toBeValidDateString(): R;
      
      /**
       * Validates that the received value is a valid time string (HH:MM)
       */
      toBeValidTimeString(): R;
      
      /**
       * Validates that the received value is a valid money amount (non-negative, max 2 decimal places)
       */
      toHaveValidMoneyAmount(): R;
      
      /**
       * Validates that the received value is valid decimal hours (0-24)
       */
      toBeValidDecimalHours(): R;
      
      /**
       * Validates that the received number is within the specified range (inclusive)
       */
      toBeWithinRange(floor: number, ceiling: number): R;
      
      /**
       * Validates that the received value is a valid email address
       */
      toBeValidEmail(): R;
      
      /**
       * Validates that the received value is a valid 3-letter currency code
       */
      toBeValidCurrencyCode(): R;
    }
  }
}

export default harvestMatchers;