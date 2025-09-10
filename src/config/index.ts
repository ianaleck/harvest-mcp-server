import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Load environment variables
loadEnv();

// Constants
const HARVEST_API_BASE_URL = 'https://api.harvestapp.com/v2';

// Environment variable schema for validation
const envSchema = z.object({
  // Harvest API Configuration
  HARVEST_ACCESS_TOKEN: z.string().min(1, 'Harvest access token is required'),
  HARVEST_ACCOUNT_ID: z.string().min(1, 'Harvest account ID is required'),
  
  // Optional Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // API Configuration
  HARVEST_API_BASE_URL: z.string().url().default(HARVEST_API_BASE_URL),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(3),
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS_PER_SECOND: z.coerce.number().positive().default(100),
  RATE_LIMIT_BURST_SIZE: z.coerce.number().positive().default(200),
  
  // Testing Configuration (optional)
  TEST_HARVEST_ACCESS_TOKEN: z.string().optional(),
  TEST_HARVEST_ACCOUNT_ID: z.string().optional(),
});

// Validate and parse environment variables
let validatedEnv: z.infer<typeof envSchema>;

try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorMessages = error.errors.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    );
    throw new Error(
      `Environment validation failed:\n${errorMessages.join('\n')}\n\n` +
      'Please check your .env file or environment variables.'
    );
  }
  throw error;
}

// Export configuration object
export const appConfig = {
  // Harvest API
  harvest: {
    accessToken: validatedEnv.HARVEST_ACCESS_TOKEN,
    accountId: validatedEnv.HARVEST_ACCOUNT_ID,
    baseUrl: validatedEnv.HARVEST_API_BASE_URL,
    userAgent: `harvest-mcp-server/0.1.0 (Node.js ${process.version})`,
  },
  
  // HTTP Client Configuration
  http: {
    timeout: validatedEnv.REQUEST_TIMEOUT_MS,
    maxRetries: validatedEnv.MAX_RETRIES,
  },
  
  // Rate Limiting
  rateLimit: {
    requestsPerSecond: validatedEnv.RATE_LIMIT_REQUESTS_PER_SECOND,
    burstSize: validatedEnv.RATE_LIMIT_BURST_SIZE,
  },
  
  // Logging
  logging: {
    level: validatedEnv.LOG_LEVEL,
    isDevelopment: validatedEnv.NODE_ENV === 'development',
    isTest: validatedEnv.NODE_ENV === 'test',
  },
  
  // Environment
  env: validatedEnv.NODE_ENV,
  isProduction: validatedEnv.NODE_ENV === 'production',
  isDevelopment: validatedEnv.NODE_ENV === 'development',
  isTest: validatedEnv.NODE_ENV === 'test',
  
  // Testing (if available)
  test: {
    harvestAccessToken: validatedEnv.TEST_HARVEST_ACCESS_TOKEN,
    harvestAccountId: validatedEnv.TEST_HARVEST_ACCOUNT_ID,
  },
};

// Export constants
export { HARVEST_API_BASE_URL };

// Export types
export type Config = typeof appConfig;
export type HarvestConfig = typeof appConfig.harvest;
export type HttpConfig = typeof appConfig.http;
export type LoggingConfig = typeof appConfig.logging;