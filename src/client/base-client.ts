import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { appConfig, HARVEST_API_BASE_URL } from '../config/index';
import { createLogger } from '../utils/logger';
import { HarvestAPIError } from '../utils/errors';

export interface HarvestAPIOptions {
  accessToken: string;
  accountId: string;
  baseUrl?: string;
  timeout?: number;
  httpClient?: any; // Allow injection of mock client
}

export abstract class BaseHarvestClient {
  protected readonly client: AxiosInstance;
  protected readonly accessToken: string;
  protected readonly accountId: string;
  protected readonly baseUrl: string;
  protected readonly logger: any;

  constructor(options: HarvestAPIOptions, loggerName: string = 'harvest-api') {
    this.accessToken = options.accessToken;
    this.accountId = options.accountId;
    this.baseUrl = options.baseUrl || HARVEST_API_BASE_URL;
    this.logger = createLogger(loggerName);

    // Use provided mock client or create real axios client
    if (options.httpClient) {
      this.client = options.httpClient;
    } else {
      this.client = axios.create({
        baseURL: this.baseUrl,
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
        this.logger.debug(`Making request to ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`Response ${response.status} from ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const statusText = error.response.statusText;
          
          this.logger.error(`HTTP ${status} ${statusText} from ${error.config?.url}:`, {
            status,
            statusText,
            // Payment errors can contain financial notes; do not persist their response bodies.
            data: /\/invoices\/\d+\/payments(?:[?]|$)/.test(error.config?.url || '')
              ? '[redacted payment response]'
              : error.response.data
          });

          switch (status) {
            case 401:
              throw new HarvestAPIError('Authentication failed: Invalid access token or account ID', status);
            case 403:
              throw new HarvestAPIError('Access forbidden: Insufficient permissions', status);
            case 404:
              throw new HarvestAPIError('Resource not found', status);
            case 429:
              const retryAfter = error.response.headers['retry-after'];
              throw new HarvestAPIError(`Rate limit exceeded. Retry after ${retryAfter || 'unknown'} seconds`, status);
            case 500:
            case 502:
            case 503:
            case 504:
              throw new HarvestAPIError(`Server error (${status}): Please try again later`, status);
            default:
              throw new HarvestAPIError(`HTTP ${status}: ${statusText}`, status);
          }
        } else if (error.request) {
          // Network error
          this.logger.error('Network error:', error.message);
          throw new Error(`Network error: ${error.message}`);
        } else {
          // Other error
          this.logger.error('Request setup error:', error.message);
          throw new Error(`Request error: ${error.message}`);
        }
      }
    );
  }

  protected buildQueryString(query?: Record<string, any>): string {
    if (!query) return '';
    
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });
    
    return params.toString();
  }

  async close(): Promise<void> {
    this.logger.debug('Harvest API client closed');
  }
}