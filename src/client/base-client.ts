import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { appConfig, HARVEST_API_BASE_URL } from '../config/index';
import { createLogger } from '../utils/logger';

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
  protected readonly logger: any;

  constructor(options: HarvestAPIOptions, loggerName: string = 'harvest-api') {
    this.accessToken = options.accessToken;
    this.accountId = options.accountId;
    this.logger = createLogger(loggerName);

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