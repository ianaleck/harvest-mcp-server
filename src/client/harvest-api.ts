import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { z } from 'zod';
import { appConfig, HARVEST_API_BASE_URL } from '../config/index';
import { createLogger } from '../utils/logger';
import { CompanySchema } from '../schemas/company';
import { 
  TimeEntrySchema, 
  TimeEntriesListSchema,
  CreateTimeEntrySchema,
  UpdateTimeEntrySchema,
  TimeEntryQuerySchema,
  StartTimerSchema,
  StopTimerSchema,
  RestartTimerSchema,
  type TimeEntry,
  type TimeEntriesList,
  type CreateTimeEntryInput,
  type UpdateTimeEntryInput,
  type TimeEntryQuery,
  type StartTimerInput,
  type StopTimerInput,
  type RestartTimerInput
} from '../schemas/time-entry';

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

  async getTimeEntries(query?: TimeEntryQuery): Promise<TimeEntriesList> {
    try {
      // Validate query parameters
      const validatedQuery = query ? TimeEntryQuerySchema.parse(query) : {};
      
      // Build query string
      const params = new URLSearchParams();
      Object.entries(validatedQuery).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/time_entries?${queryString}` : '/time_entries';
      
      logger.debug('Fetching time entries', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      // Validate response with schema
      const timeEntries = TimeEntriesListSchema.parse(response.data);
      
      logger.info('Successfully retrieved time entries', {
        count: timeEntries.time_entries.length,
        page: timeEntries.page,
        totalPages: timeEntries.total_pages
      });
      
      return timeEntries;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Time entries response validation failed:', error.errors);
        throw new Error('Invalid time entries data received from Harvest API');
      }
      throw error;
    }
  }

  async getTimeEntry(timeEntryId: number): Promise<TimeEntry> {
    try {
      logger.debug('Fetching time entry', { timeEntryId });
      const response: AxiosResponse = await this.client.get(`/time_entries/${timeEntryId}`);
      
      // Validate response with schema
      const timeEntry = TimeEntrySchema.parse(response.data);
      
      logger.info('Successfully retrieved time entry', {
        timeEntryId: timeEntry.id,
        projectId: timeEntry.project.id,
        hours: timeEntry.hours
      });
      
      return timeEntry;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Time entry response validation failed:', error.errors);
        throw new Error('Invalid time entry data received from Harvest API');
      }
      throw error;
    }
  }

  async createTimeEntry(input: CreateTimeEntryInput): Promise<TimeEntry> {
    try {
      // Validate input
      const validatedInput = CreateTimeEntrySchema.parse(input);
      
      logger.debug('Creating time entry', {
        projectId: validatedInput.project_id,
        taskId: validatedInput.task_id,
        spentDate: validatedInput.spent_date,
        hours: validatedInput.hours
      });
      
      const response: AxiosResponse = await this.client.post('/time_entries', validatedInput);
      
      // Validate response with schema
      const timeEntry = TimeEntrySchema.parse(response.data);
      
      logger.info('Successfully created time entry', {
        timeEntryId: timeEntry.id,
        projectId: timeEntry.project.id,
        hours: timeEntry.hours
      });
      
      return timeEntry;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Create time entry validation failed:', error.errors);
        throw new Error('Invalid time entry input data');
      }
      throw error;
    }
  }

  async updateTimeEntry(input: UpdateTimeEntryInput): Promise<TimeEntry> {
    try {
      // Validate input
      const validatedInput = UpdateTimeEntrySchema.parse(input);
      const { id, ...updateData } = validatedInput;
      
      logger.debug('Updating time entry', {
        timeEntryId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response: AxiosResponse = await this.client.patch(`/time_entries/${id}`, updateData);
      
      // Validate response with schema
      const timeEntry = TimeEntrySchema.parse(response.data);
      
      logger.info('Successfully updated time entry', {
        timeEntryId: timeEntry.id,
        projectId: timeEntry.project.id,
        hours: timeEntry.hours
      });
      
      return timeEntry;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Update time entry validation failed:', error.errors);
        throw new Error('Invalid time entry update data');
      }
      throw error;
    }
  }

  async deleteTimeEntry(timeEntryId: number): Promise<void> {
    try {
      logger.debug('Deleting time entry', { timeEntryId });
      
      await this.client.delete(`/time_entries/${timeEntryId}`);
      
      logger.info('Successfully deleted time entry', { timeEntryId });
    } catch (error) {
      throw error;
    }
  }

  async startTimer(input: StartTimerInput): Promise<TimeEntry> {
    try {
      // Validate input
      const validatedInput = StartTimerSchema.parse(input);
      
      logger.debug('Starting timer', {
        projectId: validatedInput.project_id,
        taskId: validatedInput.task_id,
        spentDate: validatedInput.spent_date
      });
      
      // For timer start, we create a time entry with is_running: true
      const response: AxiosResponse = await this.client.post('/time_entries', {
        ...validatedInput,
        // Timer entries don't have hours initially
      });
      
      // Validate response with schema
      const timeEntry = TimeEntrySchema.parse(response.data);
      
      logger.info('Successfully started timer', {
        timeEntryId: timeEntry.id,
        projectId: timeEntry.project.id,
        isRunning: timeEntry.is_running
      });
      
      return timeEntry;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Start timer validation failed:', error.errors);
        throw new Error('Invalid timer start data');
      }
      throw error;
    }
  }

  async stopTimer(input: StopTimerInput): Promise<TimeEntry> {
    try {
      // Validate input
      const validatedInput = StopTimerSchema.parse(input);
      
      logger.debug('Stopping timer', { timeEntryId: validatedInput.id });
      
      const response: AxiosResponse = await this.client.patch(`/time_entries/${validatedInput.id}/stop`);
      
      // Validate response with schema
      const timeEntry = TimeEntrySchema.parse(response.data);
      
      logger.info('Successfully stopped timer', {
        timeEntryId: timeEntry.id,
        hours: timeEntry.hours,
        isRunning: timeEntry.is_running
      });
      
      return timeEntry;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Stop timer validation failed:', error.errors);
        throw new Error('Invalid timer stop data');
      }
      throw error;
    }
  }

  async restartTimer(input: RestartTimerInput): Promise<TimeEntry> {
    try {
      // Validate input
      const validatedInput = RestartTimerSchema.parse(input);
      
      logger.debug('Restarting timer', { timeEntryId: validatedInput.id });
      
      const response: AxiosResponse = await this.client.patch(`/time_entries/${validatedInput.id}/restart`);
      
      // Validate response with schema
      const timeEntry = TimeEntrySchema.parse(response.data);
      
      logger.info('Successfully restarted timer', {
        timeEntryId: timeEntry.id,
        projectId: timeEntry.project.id,
        isRunning: timeEntry.is_running
      });
      
      return timeEntry;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Restart timer validation failed:', error.errors);
        throw new Error('Invalid timer restart data');
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    logger.debug('Harvest API client closed');
  }
}