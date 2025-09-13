import { AxiosResponse } from 'axios';
import { z } from 'zod';
import { BaseHarvestClient, HarvestAPIOptions } from './base-client';
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserQuerySchema,
  type CreateUserInput,
  type UpdateUserInput,
  type UserQuery
} from '../schemas/user';

export class UsersClient extends BaseHarvestClient {
  constructor(options: HarvestAPIOptions) {
    super(options, 'users-client');
  }

  async getUsers(query?: UserQuery): Promise<any> {
    try {
      const validatedQuery = query ? UserQuerySchema.parse(query) : {};
      const queryString = this.buildQueryString(validatedQuery);
      const url = queryString ? `/users?${queryString}` : '/users';
      
      this.logger.debug('Fetching users', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      this.logger.info('Successfully retrieved users', {
        count: response.data.users?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Users query validation failed:', error.errors);
        throw new Error('Invalid users query parameters');
      }
      throw error;
    }
  }

  async getUser(userId: number): Promise<any> {
    try {
      this.logger.debug('Fetching user', { userId });
      const response: AxiosResponse = await this.client.get(`/users/${userId}`);
      
      this.logger.info('Successfully retrieved user', {
        userId: response.data.id,
        userName: `${response.data.first_name} ${response.data.last_name}`
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get user:', { error: (error as Error).message });
      throw error;
    }
  }

  async createUser(input: CreateUserInput): Promise<any> {
    try {
      const validatedInput = CreateUserSchema.parse(input);
      
      this.logger.debug('Creating user', {
        firstName: validatedInput.first_name,
        lastName: validatedInput.last_name,
        email: validatedInput.email
      });
      
      const response: AxiosResponse = await this.client.post('/users', validatedInput);
      
      this.logger.info('Successfully created user', {
        userId: response.data.id,
        userName: `${response.data.first_name} ${response.data.last_name}`
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Create user validation failed:', error.errors);
        throw new Error('Invalid user input data');
      }
      throw error;
    }
  }

  async updateUser(input: UpdateUserInput): Promise<any> {
    try {
      const validatedInput = UpdateUserSchema.parse(input);
      const { id, ...updateData } = validatedInput;
      
      this.logger.debug('Updating user', {
        userId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response: AxiosResponse = await this.client.patch(`/users/${id}`, updateData);
      
      this.logger.info('Successfully updated user', {
        userId: response.data.id,
        userName: `${response.data.first_name} ${response.data.last_name}`
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Update user validation failed:', error.errors);
        throw new Error('Invalid user update data');
      }
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      this.logger.debug('Deleting user', { userId });
      await this.client.delete(`/users/${userId}`);
      this.logger.info('Successfully deleted user', { userId });
    } catch (error) {
      this.logger.error('Failed to delete user:', { error: (error as Error).message });
      throw error;
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      this.logger.debug('Fetching current user');
      const response: AxiosResponse = await this.client.get('/users/me');
      
      this.logger.info('Successfully retrieved current user', {
        userId: response.data.id,
        userName: `${response.data.first_name} ${response.data.last_name}`
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get current user:', { error: (error as Error).message });
      throw error;
    }
  }
}