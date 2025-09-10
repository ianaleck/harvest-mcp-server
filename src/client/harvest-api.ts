import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { z } from 'zod';
import { appConfig, HARVEST_API_BASE_URL } from '../config/index';
import { createLogger } from '../utils/logger';
import { CompanySchema } from '../schemas/company';

const logger = createLogger('harvest-api');

export interface HarvestAPIOptions {
  accessToken: string;
  accountId: string;
  baseUrl?: string;
  timeout?: number;
  httpClient?: any; // Allow injection of mock client
}

export class HarvestAPIClient {
  private client: AxiosInstance;
  private accessToken: string;
  private accountId: string;

  constructor(options: HarvestAPIOptions) {
    this.accessToken = options.accessToken;
    this.accountId = options.accountId;

    // Use provided mock client or create real axios client
    if (options.httpClient) {
      this.client = options.httpClient;
    } else {
      this.client = axios.create({
        baseURL: options.baseUrl || HARVEST_API_BASE_URL,
        timeout: options.timeout || appConfig.http.timeout,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Harvest-Account-Id': this.accountId,
          'User-Agent': appConfig.harvest.userAgent,
          'Content-Type': 'application/json',
        },
      });

      this.setupInterceptors();
    }
  }

  private setupInterceptors() {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Making request to ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Response ${response.status} from ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const statusText = error.response.statusText;
          
          logger.error(`HTTP ${status} ${statusText} from ${error.config?.url}:`, {
            status,
            statusText,
            data: error.response.data
          });

          switch (status) {
            case 401:
              throw new Error('Authentication failed: Invalid access token or account ID');
            case 403:
              throw new Error('Access forbidden: Insufficient permissions');
            case 404:
              throw new Error('Resource not found');
            case 429:
              const retryAfter = error.response.headers['retry-after'];
              throw new Error(`Rate limit exceeded. Retry after ${retryAfter || 'unknown'} seconds`);
            case 500:
            case 502:
            case 503:
            case 504:
              throw new Error(`Server error (${status}): Please try again later`);
            default:
              throw new Error(`HTTP ${status}: ${statusText}`);
          }
        } else if (error.request) {
          // Network error
          logger.error('Network error:', error.message);
          throw new Error(`Network error: ${error.message}`);
        } else {
          // Other error
          logger.error('Request setup error:', error.message);
          throw new Error(`Request error: ${error.message}`);
        }
      }
    );
  }

  async getCompany(): Promise<z.infer<typeof CompanySchema>> {
    try {
      const response: AxiosResponse = await this.client.get('/company');
      
      logger.debug('Raw API response:', { 
        status: response.status, 
        data: response.data,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      
      // Validate response with schema
      const company = CompanySchema.parse(response.data);
      
      logger.info('Successfully retrieved company information', {
        companyId: company.id,
        companyName: company.name
      });
      
      return company;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Company response validation failed:', error.errors);
        throw new Error(`Invalid company data received from Harvest API`);
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    // Cleanup any resources if needed
    logger.debug('Harvest API client closed');
  }
}