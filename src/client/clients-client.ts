import { AxiosResponse } from 'axios';
import { z } from 'zod';
import { BaseHarvestClient, HarvestAPIOptions } from './base-client';
import {
  CreateClientSchema,
  UpdateClientSchema,
  ClientQuerySchema,
  type CreateClientInput,
  type UpdateClientInput,
  type ClientQuery
} from '../schemas/client';

export class ClientsClient extends BaseHarvestClient {
  constructor(options: HarvestAPIOptions) {
    super(options, 'clients-client');
  }

  async getClients(query?: ClientQuery): Promise<any> {
    try {
      const validatedQuery = query ? ClientQuerySchema.parse(query) : {};
      const queryString = this.buildQueryString(validatedQuery);
      const url = queryString ? `/clients?${queryString}` : '/clients';
      
      this.logger.debug('Fetching clients', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      this.logger.info('Successfully retrieved clients', {
        count: response.data.clients?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Clients query validation failed:', error.errors);
        throw new Error('Invalid clients query parameters');
      }
      throw error;
    }
  }

  async getClient(clientId: number): Promise<any> {
    try {
      this.logger.debug('Fetching client', { clientId });
      const response: AxiosResponse = await this.client.get(`/clients/${clientId}`);
      
      this.logger.info('Successfully retrieved client', {
        clientId: response.data.id,
        clientName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to retrieve client', { clientId, error: (error as Error).message });
      throw error;
    }
  }

  async createClient(input: CreateClientInput): Promise<any> {
    try {
      const validatedInput = CreateClientSchema.parse(input);
      
      this.logger.debug('Creating client', { name: validatedInput.name });
      const response: AxiosResponse = await this.client.post('/clients', validatedInput);
      
      this.logger.info('Successfully created client', {
        clientId: response.data.id,
        clientName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Create client validation failed:', error.errors);
        throw new Error('Invalid client input data');
      }
      throw error;
    }
  }

  async updateClient(input: UpdateClientInput): Promise<any> {
    try {
      const validatedInput = UpdateClientSchema.parse(input);
      const { id, ...updateData } = validatedInput;
      
      this.logger.debug('Updating client', {
        clientId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response: AxiosResponse = await this.client.patch(`/clients/${id}`, updateData);
      
      this.logger.info('Successfully updated client', {
        clientId: response.data.id,
        clientName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Update client validation failed:', error.errors);
        throw new Error('Invalid client update data');
      }
      throw error;
    }
  }

  async deleteClient(clientId: number): Promise<void> {
    try {
      this.logger.debug('Deleting client', { clientId });
      await this.client.delete(`/clients/${clientId}`);
      this.logger.info('Successfully deleted client', { clientId });
    } catch (error) {
      this.logger.error('Failed to delete client', { clientId, error: (error as Error).message });
      throw error;
    }
  }
}