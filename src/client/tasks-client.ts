import { BaseHarvestClient, HarvestAPIOptions } from './base-client';

export class TasksClient extends BaseHarvestClient {
  constructor(options: HarvestAPIOptions) {
    super(options, 'tasks-client');
  }

  async getTasks(query?: any): Promise<any> {
    try {
      // Build query string
      const queryString = this.buildQueryString(query);
      const url = queryString ? `/tasks?${queryString}` : '/tasks';
      
      this.logger.debug('Fetching tasks', { query });
      const response = await this.client.get(url);
      
      this.logger.info('Successfully retrieved tasks', {
        count: response.data.tasks?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list tasks:', error);
      throw error;
    }
  }

  async getTask(taskId: number): Promise<any> {
    try {
      this.logger.debug('Fetching task', { taskId });
      const response = await this.client.get(`/tasks/${taskId}`);
      
      this.logger.info('Successfully retrieved task', {
        taskId: response.data.id,
        taskName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch task:', error);
      throw error;
    }
  }

  async createTask(input: any): Promise<any> {
    try {
      this.logger.debug('Creating task', { name: input.name });
      
      const response = await this.client.post('/tasks', input);
      
      this.logger.info('Successfully created task', {
        taskId: response.data.id,
        taskName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTask(input: any): Promise<any> {
    try {
      const { id, ...updateData } = input;
      
      this.logger.debug('Updating task', {
        taskId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response = await this.client.patch(`/tasks/${id}`, updateData);
      
      this.logger.info('Successfully updated task', {
        taskId: response.data.id,
        taskName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update task:', error);
      throw error;
    }
  }

  async deleteTask(taskId: number): Promise<void> {
    try {
      this.logger.debug('Deleting task', { taskId });
      
      await this.client.delete(`/tasks/${taskId}`);
      
      this.logger.info('Successfully deleted task', { taskId });
    } catch (error) {
      this.logger.error('Failed to delete task:', error);
      throw error;
    }
  }
}