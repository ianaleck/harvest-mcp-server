import { AxiosResponse } from 'axios';
import { z } from 'zod';
import { BaseHarvestClient, HarvestAPIOptions } from './base-client';
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

export class TimeEntriesClient extends BaseHarvestClient {
  constructor(options: HarvestAPIOptions) {
    super(options, 'time-entries-client');
  }

  async getTimeEntries(query?: TimeEntryQuery): Promise<any> {
    try {
      // Validate query parameters
      const validatedQuery = query ? TimeEntryQuerySchema.parse(query) : {};
      
      // Build query string
      const queryString = this.buildQueryString(validatedQuery);
      const url = queryString ? `/time_entries?${queryString}` : '/time_entries';
      
      this.logger.debug('Fetching time entries', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      this.logger.info('Successfully retrieved time entries', {
        count: response.data.time_entries?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Time entries query validation failed:', error.errors);
        throw new Error('Invalid time entries query parameters');
      }
      throw error;
    }
  }

  async getTimeEntry(timeEntryId: number): Promise<any> {
    try {
      this.logger.debug('Fetching time entry', { timeEntryId });
      const response: AxiosResponse = await this.client.get(`/time_entries/${timeEntryId}`);
      
      this.logger.info('Successfully retrieved time entry', {
        timeEntryId: response.data.id,
        projectId: response.data.project?.id,
        hours: response.data.hours
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Get time entry validation failed:', error.errors);
        throw new Error('Invalid time entry ID');
      }
      throw error;
    }
  }

  async createTimeEntry(input: CreateTimeEntryInput): Promise<any> {
    try {
      // Validate input
      const validatedInput = CreateTimeEntrySchema.parse(input);
      
      this.logger.debug('Creating time entry', {
        projectId: validatedInput.project_id,
        taskId: validatedInput.task_id,
        spentDate: validatedInput.spent_date,
        hours: validatedInput.hours
      });
      
      const response: AxiosResponse = await this.client.post('/time_entries', validatedInput);
      
      this.logger.info('Successfully created time entry', {
        timeEntryId: response.data.id,
        projectId: response.data.project?.id,
        hours: response.data.hours
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Create time entry validation failed:', error.errors);
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
      
      this.logger.debug('Updating time entry', {
        timeEntryId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response: AxiosResponse = await this.client.patch(`/time_entries/${id}`, updateData);
      
      this.logger.info('Successfully updated time entry', {
        timeEntryId: response.data.id,
        projectId: response.data.project?.id,
        hours: response.data.hours
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Update time entry validation failed:', error.errors);
        throw new Error('Invalid time entry update data');
      }
      throw error;
    }
  }

  async deleteTimeEntry(timeEntryId: number): Promise<void> {
    try {
      this.logger.debug('Deleting time entry', { timeEntryId });
      
      await this.client.delete(`/time_entries/${timeEntryId}`);
      
      this.logger.info('Successfully deleted time entry', { timeEntryId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Delete time entry validation failed:', error.errors);
        throw new Error('Invalid time entry ID');
      }
      throw error;
    }
  }

  async startTimer(input: StartTimerInput): Promise<any> {
    try {
      // Validate input
      const validatedInput = StartTimerSchema.parse(input);
      
      this.logger.debug('Starting timer', {
        projectId: validatedInput.project_id,
        taskId: validatedInput.task_id,
        spentDate: validatedInput.spent_date
      });
      
      // Generate current time for started_time
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // Create running timer by providing started_time without ended_time
      // This works for both timestamp-based and duration-based accounts
      const response: AxiosResponse = await this.client.post('/time_entries', {
        ...validatedInput,
        started_time: currentTime,
      });
      
      this.logger.info('Successfully started timer', {
        timeEntryId: response.data.id,
        projectId: response.data.project?.id,
        isRunning: response.data.is_running,
        startedTime: currentTime
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Start timer validation failed:', error.errors);
        throw new Error('Invalid timer start data');
      }
      throw error;
    }
  }

  async stopTimer(input: StopTimerInput): Promise<any> {
    try {
      // Validate input
      const validatedInput = StopTimerSchema.parse(input);
      
      this.logger.debug('Stopping timer', { timeEntryId: validatedInput.id });
      
      const response: AxiosResponse = await this.client.patch(`/time_entries/${validatedInput.id}/stop`);
      
      this.logger.info('Successfully stopped timer', {
        timeEntryId: response.data.id,
        hours: response.data.hours,
        isRunning: response.data.is_running
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Stop timer validation failed:', error.errors);
        throw new Error('Invalid timer stop data');
      }
      throw error;
    }
  }

  async restartTimer(input: RestartTimerInput): Promise<any> {
    try {
      // Validate input
      const validatedInput = RestartTimerSchema.parse(input);
      
      this.logger.debug('Restarting timer', { timeEntryId: validatedInput.id });
      
      const response: AxiosResponse = await this.client.patch(`/time_entries/${validatedInput.id}/restart`);
      
      this.logger.info('Successfully restarted timer', {
        timeEntryId: response.data.id,
        projectId: response.data.project?.id,
        isRunning: response.data.is_running
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Restart timer validation failed:', error.errors);
        throw new Error('Invalid timer restart data');
      }
      throw error;
    }
  }
}