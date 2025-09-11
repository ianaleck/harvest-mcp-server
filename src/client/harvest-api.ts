import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { z } from 'zod';
import { appConfig, HARVEST_API_BASE_URL } from '../config/index';
import { createLogger } from '../utils/logger';
import { 
  CreateTimeEntrySchema,
  UpdateTimeEntrySchema,
  TimeEntryQuerySchema,
  StartTimerSchema,
  StopTimerSchema,
  RestartTimerSchema,
  type CreateTimeEntryInput,
  type UpdateTimeEntryInput,
  type TimeEntryQuery,
  type StartTimerInput,
  type StopTimerInput,
  type RestartTimerInput
} from '../schemas/time-entry';

// Client imports
import {
  CreateClientSchema,
  UpdateClientSchema,
  ClientQuerySchema,
  type CreateClientInput,
  type UpdateClientInput,
  type ClientQuery
} from '../schemas/client';

// User imports
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserQuerySchema,
  type CreateUserInput,
  type UpdateUserInput,
  type UserQuery
} from '../schemas/user';

// Invoice imports
import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  InvoiceQuerySchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type InvoiceQuery
} from '../schemas/invoice';

// Expense imports
import {
  CreateExpenseSchema,
  UpdateExpenseSchema,
  ExpenseQuerySchema,
  ExpenseCategoryQuerySchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type ExpenseQuery,
  type ExpenseCategoryQuery
} from '../schemas/expense';

// Estimate imports
import {
  CreateEstimateSchema,
  UpdateEstimateSchema,
  EstimateQuerySchema,
  type CreateEstimateInput,
  type UpdateEstimateInput,
  type EstimateQuery,
} from '../schemas/estimate';

// Report imports
import {
  TimeReportQuerySchema,
  ExpenseReportQuerySchema,
  ProjectBudgetReportQuerySchema,
  UninvoicedReportQuerySchema,
  type TimeReportQuery,
  type ExpenseReportQuery,
  type ProjectBudgetReportQuery,
  type UninvoicedReportQuery
} from '../schemas/report';

const logger = createLogger('harvest-api');

export interface HarvestAPIOptions {
  accessToken: string;
  accountId: string;
  baseUrl?: string;
  timeout?: number;
  httpClient?: any; // Allow injection of mock client
}

export class HarvestAPIClient {
  private readonly client: AxiosInstance;
  private readonly accessToken: string;
  private readonly accountId: string;

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

  async getCompany(): Promise<any> {
    try {
      const response: AxiosResponse = await this.client.get('/company');
      
      logger.debug('Raw API response:', { 
        status: response.status, 
        data: response.data,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      
      logger.info('Successfully retrieved company information', {
        companyId: response.data.id,
        companyName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getTimeEntries(query?: TimeEntryQuery): Promise<any> {
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
      
      logger.info('Successfully retrieved time entries', {
        count: response.data.time_entries?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Time entries query validation failed:', error.errors);
        throw new Error('Invalid time entries query parameters');
      }
      throw error;
    }
  }

  async getTimeEntry(timeEntryId: number): Promise<any> {
    try {
      logger.debug('Fetching time entry', { timeEntryId });
      const response: AxiosResponse = await this.client.get(`/time_entries/${timeEntryId}`);
      
      logger.info('Successfully retrieved time entry', {
        timeEntryId: response.data.id,
        projectId: response.data.project?.id,
        hours: response.data.hours
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createTimeEntry(input: CreateTimeEntryInput): Promise<any> {
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
      
      logger.info('Successfully created time entry', {
        timeEntryId: response.data.id,
        projectId: response.data.project?.id,
        hours: response.data.hours
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Create time entry validation failed:', error.errors);
        throw new Error('Invalid time entry input data');
      }
      throw error;
    }
  }

  async updateTimeEntry(input: UpdateTimeEntryInput): Promise<any> {
    try {
      // Validate input
      const validatedInput = UpdateTimeEntrySchema.parse(input);
      const { id, ...updateData } = validatedInput;
      
      logger.debug('Updating time entry', {
        timeEntryId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response: AxiosResponse = await this.client.patch(`/time_entries/${id}`, updateData);
      
      logger.info('Successfully updated time entry', {
        timeEntryId: response.data.id,
        projectId: response.data.project?.id,
        hours: response.data.hours
      });
      
      return response.data;
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

  async startTimer(input: StartTimerInput): Promise<any> {
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
      
      logger.info('Successfully started timer', {
        timeEntryId: response.data.id,
        projectId: response.data.project?.id,
        isRunning: response.data.is_running
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Start timer validation failed:', error.errors);
        throw new Error('Invalid timer start data');
      }
      throw error;
    }
  }

  async stopTimer(input: StopTimerInput): Promise<any> {
    try {
      // Validate input
      const validatedInput = StopTimerSchema.parse(input);
      
      logger.debug('Stopping timer', { timeEntryId: validatedInput.id });
      
      const response: AxiosResponse = await this.client.patch(`/time_entries/${validatedInput.id}/stop`);
      
      logger.info('Successfully stopped timer', {
        timeEntryId: response.data.id,
        hours: response.data.hours,
        isRunning: response.data.is_running
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Stop timer validation failed:', error.errors);
        throw new Error('Invalid timer stop data');
      }
      throw error;
    }
  }

  async restartTimer(input: RestartTimerInput): Promise<any> {
    try {
      // Validate input
      const validatedInput = RestartTimerSchema.parse(input);
      
      logger.debug('Restarting timer', { timeEntryId: validatedInput.id });
      
      const response: AxiosResponse = await this.client.patch(`/time_entries/${validatedInput.id}/restart`);
      
      logger.info('Successfully restarted timer', {
        timeEntryId: response.data.id,
        projectId: response.data.project?.id,
        isRunning: response.data.is_running
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Restart timer validation failed:', error.errors);
        throw new Error('Invalid timer restart data');
      }
      throw error;
    }
  }

  async getProjects(query?: any): Promise<any> {
    try {
      // Build query string
      const params = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, String(value));
          }
        });
      }
      
      const queryString = params.toString();
      const url = queryString ? `/projects?${queryString}` : '/projects';
      
      logger.debug('Fetching projects', { query });
      const response = await this.client.get(url);
      
      logger.info('Successfully retrieved projects', {
        count: response.data.projects?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to list projects:', error);
      throw error;
    }
  }

  async getProject(projectId: number): Promise<any> {
    try {
      logger.debug('Fetching project', { projectId });
      const response = await this.client.get(`/projects/${projectId}`);
      
      logger.info('Successfully retrieved project', {
        projectId: response.data.id,
        projectName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch project:', error);
      throw error;
    }
  }

  async createProject(input: any): Promise<any> {
    try {
      logger.debug('Creating project', {
        name: input.name,
        clientId: input.client_id
      });
      
      const response = await this.client.post('/projects', input);
      
      logger.info('Successfully created project', {
        projectId: response.data.id,
        projectName: response.data.name,
        clientId: response.data.client.id
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to create project:', error);
      throw error;
    }
  }

  async updateProject(input: any): Promise<any> {
    try {
      const { id, ...updateData } = input;
      
      logger.debug('Updating project', {
        projectId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response = await this.client.patch(`/projects/${id}`, updateData);
      
      logger.info('Successfully updated project', {
        projectId: response.data.id,
        projectName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to update project:', error);
      throw error;
    }
  }

  async deleteProject(projectId: number): Promise<void> {
    try {
      logger.debug('Deleting project', { projectId });
      
      await this.client.delete(`/projects/${projectId}`);
      
      logger.info('Successfully deleted project', { projectId });
    } catch (error) {
      logger.error('Failed to delete project:', error);
      throw error;
    }
  }

  async getTasks(query?: any): Promise<any> {
    try {
      // Build query string
      const params = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, String(value));
          }
        });
      }
      
      const queryString = params.toString();
      const url = queryString ? `/tasks?${queryString}` : '/tasks';
      
      logger.debug('Fetching tasks', { query });
      const response = await this.client.get(url);
      
      logger.info('Successfully retrieved tasks', {
        count: response.data.tasks?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to list tasks:', error);
      throw error;
    }
  }

  async getTask(taskId: number): Promise<any> {
    try {
      logger.debug('Fetching task', { taskId });
      const response = await this.client.get(`/tasks/${taskId}`);
      
      logger.info('Successfully retrieved task', {
        taskId: response.data.id,
        taskName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch task:', error);
      throw error;
    }
  }

  async createTask(input: any): Promise<any> {
    try {
      logger.debug('Creating task', { name: input.name });
      
      const response = await this.client.post('/tasks', input);
      
      logger.info('Successfully created task', {
        taskId: response.data.id,
        taskName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTask(input: any): Promise<any> {
    try {
      const { id, ...updateData } = input;
      
      logger.debug('Updating task', {
        taskId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response = await this.client.patch(`/tasks/${id}`, updateData);
      
      logger.info('Successfully updated task', {
        taskId: response.data.id,
        taskName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to update task:', error);
      throw error;
    }
  }

  async deleteTask(taskId: number): Promise<void> {
    try {
      logger.debug('Deleting task', { taskId });
      
      await this.client.delete(`/tasks/${taskId}`);
      
      logger.info('Successfully deleted task', { taskId });
    } catch (error) {
      logger.error('Failed to delete task:', error);
      throw error;
    }
  }

  async getProjectTaskAssignments(projectId: number, query?: any): Promise<any> {
    try {
      // Build query string
      const params = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, String(value));
          }
        });
      }
      
      const queryString = params.toString();
      const url = queryString ? `/projects/${projectId}/task_assignments?${queryString}` : `/projects/${projectId}/task_assignments`;
      
      logger.debug('Fetching project task assignments', { projectId, query });
      const response = await this.client.get(url);
      
      logger.info('Successfully retrieved project task assignments', {
        projectId,
        count: response.data.task_assignments?.length || 0
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to list project task assignments:', error);
      throw error;
    }
  }

  async createProjectTaskAssignment(projectId: number, input: any): Promise<any> {
    try {
      logger.debug('Creating project task assignment', { projectId, taskId: input.task_id });
      
      const response = await this.client.post(`/projects/${projectId}/task_assignments`, input);
      
      logger.info('Successfully created project task assignment', {
        projectId,
        taskAssignmentId: response.data.id,
        taskId: response.data.task.id
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to create project task assignment:', error);
      throw error;
    }
  }

  async updateProjectTaskAssignment(projectId: number, input: any): Promise<any> {
    try {
      const { id, ...updateData } = input;
      
      logger.debug('Updating project task assignment', { projectId, taskAssignmentId: id });
      
      const response = await this.client.patch(`/projects/${projectId}/task_assignments/${id}`, updateData);
      
      logger.info('Successfully updated project task assignment', {
        projectId,
        taskAssignmentId: response.data.id
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to update project task assignment:', error);
      throw error;
    }
  }

  async deleteProjectTaskAssignment(projectId: number, taskAssignmentId: number): Promise<void> {
    try {
      logger.debug('Deleting project task assignment', { projectId, taskAssignmentId });
      
      await this.client.delete(`/projects/${projectId}/task_assignments/${taskAssignmentId}`);
      
      logger.info('Successfully deleted project task assignment', { projectId, taskAssignmentId });
    } catch (error) {
      logger.error('Failed to delete project task assignment:', error);
      throw error;
    }
  }

  // Client Management Methods
  async getClients(query?: ClientQuery): Promise<any> {
    try {
      const validatedQuery = query ? ClientQuerySchema.parse(query) : {};
      const params = new URLSearchParams();
      Object.entries(validatedQuery).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/clients?${queryString}` : '/clients';
      
      logger.debug('Fetching clients', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      logger.info('Successfully retrieved clients', {
        count: response.data.clients?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Clients query validation failed:', error.errors);
        throw new Error('Invalid clients query parameters');
      }
      throw error;
    }
  }

  async getClient(clientId: number): Promise<any> {
    try {
      logger.debug('Fetching client', { clientId });
      const response: AxiosResponse = await this.client.get(`/clients/${clientId}`);
      
      logger.info('Successfully retrieved client', {
        clientId: response.data.id,
        clientName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createClient(input: CreateClientInput): Promise<any> {
    try {
      const validatedInput = CreateClientSchema.parse(input);
      
      logger.debug('Creating client', { name: validatedInput.name });
      const response: AxiosResponse = await this.client.post('/clients', validatedInput);
      
      logger.info('Successfully created client', {
        clientId: response.data.id,
        clientName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Create client validation failed:', error.errors);
        throw new Error('Invalid client input data');
      }
      throw error;
    }
  }

  async updateClient(input: UpdateClientInput): Promise<any> {
    try {
      const validatedInput = UpdateClientSchema.parse(input);
      const { id, ...updateData } = validatedInput;
      
      logger.debug('Updating client', {
        clientId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response: AxiosResponse = await this.client.patch(`/clients/${id}`, updateData);
      
      logger.info('Successfully updated client', {
        clientId: response.data.id,
        clientName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Update client validation failed:', error.errors);
        throw new Error('Invalid client update data');
      }
      throw error;
    }
  }

  async deleteClient(clientId: number): Promise<void> {
    try {
      logger.debug('Deleting client', { clientId });
      await this.client.delete(`/clients/${clientId}`);
      logger.info('Successfully deleted client', { clientId });
    } catch (error) {
      throw error;
    }
  }

  // User Management Methods
  async getUsers(query?: UserQuery): Promise<any> {
    try {
      const validatedQuery = query ? UserQuerySchema.parse(query) : {};
      const params = new URLSearchParams();
      Object.entries(validatedQuery).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/users?${queryString}` : '/users';
      
      logger.debug('Fetching users', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      logger.info('Successfully retrieved users', {
        count: response.data.users?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Users query validation failed:', error.errors);
        throw new Error('Invalid users query parameters');
      }
      throw error;
    }
  }

  async getUser(userId: number): Promise<any> {
    try {
      logger.debug('Fetching user', { userId });
      const response: AxiosResponse = await this.client.get(`/users/${userId}`);
      
      logger.info('Successfully retrieved user', {
        userId: response.data.id,
        userName: `${response.data.first_name} ${response.data.last_name}`
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createUser(input: CreateUserInput): Promise<any> {
    try {
      const validatedInput = CreateUserSchema.parse(input);
      
      logger.debug('Creating user', {
        firstName: validatedInput.first_name,
        lastName: validatedInput.last_name,
        email: validatedInput.email
      });
      
      const response: AxiosResponse = await this.client.post('/users', validatedInput);
      
      logger.info('Successfully created user', {
        userId: response.data.id,
        userName: `${response.data.first_name} ${response.data.last_name}`
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Create user validation failed:', error.errors);
        throw new Error('Invalid user input data');
      }
      throw error;
    }
  }

  async updateUser(input: UpdateUserInput): Promise<any> {
    try {
      const validatedInput = UpdateUserSchema.parse(input);
      const { id, ...updateData } = validatedInput;
      
      logger.debug('Updating user', {
        userId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response: AxiosResponse = await this.client.patch(`/users/${id}`, updateData);
      
      logger.info('Successfully updated user', {
        userId: response.data.id,
        userName: `${response.data.first_name} ${response.data.last_name}`
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Update user validation failed:', error.errors);
        throw new Error('Invalid user update data');
      }
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      logger.debug('Deleting user', { userId });
      await this.client.delete(`/users/${userId}`);
      logger.info('Successfully deleted user', { userId });
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      logger.debug('Fetching current user');
      const response: AxiosResponse = await this.client.get('/users/me');
      
      logger.info('Successfully retrieved current user', {
        userId: response.data.id,
        userName: `${response.data.first_name} ${response.data.last_name}`
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Invoice Management Methods
  async getInvoices(query?: InvoiceQuery): Promise<any> {
    try {
      const validatedQuery = query ? InvoiceQuerySchema.parse(query) : {};
      const params = new URLSearchParams();
      Object.entries(validatedQuery).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/invoices?${queryString}` : '/invoices';
      
      logger.debug('Fetching invoices', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      logger.info('Successfully retrieved invoices', {
        count: response.data.invoices?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invoices query validation failed:', error.errors);
        throw new Error('Invalid invoices query parameters');
      }
      throw error;
    }
  }

  async getInvoice(invoiceId: number): Promise<any> {
    try {
      logger.debug('Fetching invoice', { invoiceId });
      const response: AxiosResponse = await this.client.get(`/invoices/${invoiceId}`);
      
      logger.info('Successfully retrieved invoice', {
        invoiceId: response.data.id,
        invoiceNumber: response.data.number,
        amount: response.data.amount
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createInvoice(input: CreateInvoiceInput): Promise<any> {
    try {
      const validatedInput = CreateInvoiceSchema.parse(input);
      
      logger.debug('Creating invoice', {
        clientId: validatedInput.client_id,
        subject: validatedInput.subject
      });
      
      const response: AxiosResponse = await this.client.post('/invoices', validatedInput);
      
      logger.info('Successfully created invoice', {
        invoiceId: response.data.id,
        invoiceNumber: response.data.number,
        amount: response.data.amount
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Create invoice validation failed:', error.errors);
        throw new Error('Invalid invoice input data');
      }
      throw error;
    }
  }

  async updateInvoice(input: UpdateInvoiceInput): Promise<any> {
    try {
      const validatedInput = UpdateInvoiceSchema.parse(input);
      const { id, ...updateData } = validatedInput;
      
      logger.debug('Updating invoice', {
        invoiceId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response: AxiosResponse = await this.client.patch(`/invoices/${id}`, updateData);
      
      logger.info('Successfully updated invoice', {
        invoiceId: response.data.id,
        invoiceNumber: response.data.number
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Update invoice validation failed:', error.errors);
        throw new Error('Invalid invoice update data');
      }
      throw error;
    }
  }

  async deleteInvoice(invoiceId: number): Promise<void> {
    try {
      logger.debug('Deleting invoice', { invoiceId });
      await this.client.delete(`/invoices/${invoiceId}`);
      logger.info('Successfully deleted invoice', { invoiceId });
    } catch (error) {
      throw error;
    }
  }

  // Expense Management Methods
  async getExpenses(query?: ExpenseQuery): Promise<any> {
    try {
      const validatedQuery = query ? ExpenseQuerySchema.parse(query) : {};
      const params = new URLSearchParams();
      Object.entries(validatedQuery).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/expenses?${queryString}` : '/expenses';
      
      logger.debug('Fetching expenses', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      logger.info('Successfully retrieved expenses', {
        count: response.data.expenses?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Expenses query validation failed:', error.errors);
        throw new Error('Invalid expenses query parameters');
      }
      throw error;
    }
  }

  async getExpense(expenseId: number): Promise<any> {
    try {
      logger.debug('Fetching expense', { expenseId });
      const response: AxiosResponse = await this.client.get(`/expenses/${expenseId}`);
      
      logger.info('Successfully retrieved expense', {
        expenseId: response.data.id,
        totalCost: response.data.total_cost,
        spentDate: response.data.spent_date
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createExpense(input: CreateExpenseInput): Promise<any> {
    try {
      const validatedInput = CreateExpenseSchema.parse(input);
      
      logger.debug('Creating expense', {
        projectId: validatedInput.project_id,
        totalCost: validatedInput.total_cost,
        spentDate: validatedInput.spent_date
      });
      
      const response: AxiosResponse = await this.client.post('/expenses', validatedInput);
      
      logger.info('Successfully created expense', {
        expenseId: response.data.id,
        totalCost: response.data.total_cost
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Create expense validation failed:', error.errors);
        throw new Error('Invalid expense input data');
      }
      throw error;
    }
  }

  async updateExpense(input: UpdateExpenseInput): Promise<any> {
    try {
      const validatedInput = UpdateExpenseSchema.parse(input);
      const { id, ...updateData } = validatedInput;
      
      logger.debug('Updating expense', {
        expenseId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response: AxiosResponse = await this.client.patch(`/expenses/${id}`, updateData);
      
      logger.info('Successfully updated expense', {
        expenseId: response.data.id,
        totalCost: response.data.total_cost
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Update expense validation failed:', error.errors);
        throw new Error('Invalid expense update data');
      }
      throw error;
    }
  }

  async deleteExpense(expenseId: number): Promise<void> {
    try {
      logger.debug('Deleting expense', { expenseId });
      await this.client.delete(`/expenses/${expenseId}`);
      logger.info('Successfully deleted expense', { expenseId });
    } catch (error) {
      throw error;
    }
  }

  async getExpenseCategories(query?: ExpenseCategoryQuery): Promise<any> {
    try {
      const validatedQuery = query ? ExpenseCategoryQuerySchema.parse(query) : {};
      const params = new URLSearchParams();
      Object.entries(validatedQuery).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/expense_categories?${queryString}` : '/expense_categories';
      
      logger.debug('Fetching expense categories', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      logger.info('Successfully retrieved expense categories', {
        count: response.data.expense_categories?.length || 0
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Expense categories query validation failed:', error.errors);
        throw new Error('Invalid expense categories query parameters');
      }
      throw error;
    }
  }

  // Estimate Management Methods  
  async getEstimates(query?: EstimateQuery): Promise<any> {
    try {
      const validatedQuery = query ? EstimateQuerySchema.parse(query) : {};
      const params = new URLSearchParams();
      Object.entries(validatedQuery).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/estimates?${queryString}` : '/estimates';
      
      logger.debug('Fetching estimates', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      logger.info('Successfully retrieved estimates', {
        count: response.data.estimates?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Estimates query validation failed:', error.errors);
        throw new Error('Invalid estimates query parameters');
      }
      throw error;
    }
  }

  async getEstimate(estimateId: number): Promise<any> {
    try {
      logger.debug('Fetching estimate', { estimateId });
      const response: AxiosResponse = await this.client.get(`/estimates/${estimateId}`);
      
      logger.info('Successfully retrieved estimate', {
        estimateId: response.data.id,
        estimateNumber: response.data.number,
        amount: response.data.amount
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createEstimate(input: CreateEstimateInput): Promise<any> {
    try {
      const validatedInput = CreateEstimateSchema.parse(input);
      
      logger.debug('Creating estimate', {
        clientId: validatedInput.client_id,
        subject: validatedInput.subject
      });
      
      const response: AxiosResponse = await this.client.post('/estimates', validatedInput);
      
      logger.info('Successfully created estimate', {
        estimateId: response.data.id,
        estimateNumber: response.data.number
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Create estimate validation failed:', error.errors);
        throw new Error('Invalid estimate input data');
      }
      throw error;
    }
  }

  async updateEstimate(input: UpdateEstimateInput): Promise<any> {
    try {
      const validatedInput = UpdateEstimateSchema.parse(input);
      const { id, ...updateData } = validatedInput;
      
      logger.debug('Updating estimate', {
        estimateId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response: AxiosResponse = await this.client.patch(`/estimates/${id}`, updateData);
      
      logger.info('Successfully updated estimate', {
        estimateId: response.data.id,
        estimateNumber: response.data.number
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Update estimate validation failed:', error.errors);
        throw new Error('Invalid estimate update data');
      }
      throw error;
    }
  }

  async deleteEstimate(estimateId: number): Promise<void> {
    try {
      logger.debug('Deleting estimate', { estimateId });
      await this.client.delete(`/estimates/${estimateId}`);
      logger.info('Successfully deleted estimate', { estimateId });
    } catch (error) {
      throw error;
    }
  }

  // Report Methods
  async getTimeReport(query: TimeReportQuery): Promise<any> {
    try {
      const validatedQuery = TimeReportQuerySchema.parse(query);
      
      // Provide default date range if not specified (last 30 days)
      const finalQuery = {
        ...validatedQuery,
        from: validatedQuery.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: validatedQuery.to || new Date().toISOString().split('T')[0]
      };
      
      const params = new URLSearchParams();
      Object.entries(finalQuery).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      // Determine endpoint based on group_by parameter
      const baseEndpoint = finalQuery.group_by === 'project' 
        ? '/reports/time/projects'
        : finalQuery.group_by === 'client'
        ? '/reports/time/clients'
        : finalQuery.group_by === 'task'
        ? '/reports/time/tasks'
        : '/reports/time';
      const url = `${baseEndpoint}?${queryString}`;
      
      logger.debug('Fetching time report', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      logger.info('Successfully retrieved time report', {
        totalHours: response.data.total_hours,
        totalAmount: response.data.total_amount
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Time report query validation failed:', error.errors);
        throw new Error('Invalid time report query parameters');
      }
      throw error;
    }
  }

  async getExpenseReport(query: ExpenseReportQuery): Promise<any> {
    try {
      const validatedQuery = ExpenseReportQuerySchema.parse(query);
      
      // Provide default date range if not specified (last 30 days)
      const finalQuery = {
        ...validatedQuery,
        from: validatedQuery.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: validatedQuery.to || new Date().toISOString().split('T')[0]
      };
      
      const params = new URLSearchParams();
      Object.entries(finalQuery).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      // Determine endpoint based on group_by parameter
      const baseEndpoint = finalQuery.group_by === 'project' 
        ? '/reports/expenses/projects'
        : finalQuery.group_by === 'client'
        ? '/reports/expenses/clients'
        : '/reports/expenses';
      const url = `${baseEndpoint}?${queryString}`;
      
      logger.debug('Fetching expense report', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      logger.info('Successfully retrieved expense report', {
        totalAmount: response.data.total_amount,
        totalBillableAmount: response.data.total_billable_amount
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Expense report query validation failed:', error.errors);
        throw new Error('Invalid expense report query parameters');
      }
      throw error;
    }
  }

  async getProjectBudgetReport(query?: ProjectBudgetReportQuery): Promise<any> {
    try {
      const validatedQuery = query ? ProjectBudgetReportQuerySchema.parse(query) : {};
      const params = new URLSearchParams();
      Object.entries(validatedQuery).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/reports/project_budget?${queryString}` : '/reports/project_budget';
      
      logger.debug('Fetching project budget report', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      logger.info('Successfully retrieved project budget report', {
        projectCount: response.data.results?.length || 0
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Project budget report query validation failed:', error.errors);
        throw new Error('Invalid project budget report query parameters');
      }
      throw error;
    }
  }

  async getUninvoicedReport(query: UninvoicedReportQuery): Promise<any> {
    try {
      const validatedQuery = UninvoicedReportQuerySchema.parse(query);
      
      // Provide default date range if not specified (last 30 days)
      const finalQuery = {
        ...validatedQuery,
        from: validatedQuery.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: validatedQuery.to || new Date().toISOString().split('T')[0]
      };
      
      const params = new URLSearchParams();
      Object.entries(finalQuery).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      const url = `/reports/uninvoiced?${queryString}`;
      
      logger.debug('Fetching uninvoiced report', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      logger.info('Successfully retrieved uninvoiced report', {
        totalHours: response.data.total_hours,
        totalAmount: response.data.total_amount
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Uninvoiced report query validation failed:', error.errors);
        throw new Error('Invalid uninvoiced report query parameters');
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    logger.debug('Harvest API client closed');
  }
}