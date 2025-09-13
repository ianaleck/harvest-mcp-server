import { AxiosResponse } from 'axios';
import { z } from 'zod';
import { BaseHarvestClient, HarvestAPIOptions } from './base-client';
import {
  CreateEstimateSchema,
  UpdateEstimateSchema,
  EstimateQuerySchema,
  type CreateEstimateInput,
  type UpdateEstimateInput,
  type EstimateQuery,
} from '../schemas/estimate';

export class EstimatesClient extends BaseHarvestClient {
  constructor(options: HarvestAPIOptions) {
    super(options, 'estimates-client');
  }

  async getEstimates(query?: EstimateQuery): Promise<any> {
    try {
      const validatedQuery = query ? EstimateQuerySchema.parse(query) : {};
      const queryString = this.buildQueryString(validatedQuery);
      const url = queryString ? `/estimates?${queryString}` : '/estimates';
      
      this.logger.debug('Fetching estimates', { query: validatedQuery });
      const response: AxiosResponse = await this.client.get(url);
      
      this.logger.info('Successfully retrieved estimates', {
        count: response.data.estimates?.length || 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Estimates query validation failed:', error.errors);
        throw new Error('Invalid estimates query parameters');
      }
      throw error;
    }
  }

  async getEstimate(estimateId: number): Promise<any> {
    try {
      this.logger.debug('Fetching estimate', { estimateId });
      const response: AxiosResponse = await this.client.get(`/estimates/${estimateId}`);
      
      this.logger.info('Successfully retrieved estimate', {
        estimateId: response.data.id,
        estimateNumber: response.data.number,
        amount: response.data.amount
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to retrieve estimate', { estimateId, error: (error as Error).message });
      throw error;
    }
  }

  async createEstimate(input: CreateEstimateInput): Promise<any> {
    try {
      const validatedInput = CreateEstimateSchema.parse(input);
      
      this.logger.debug('Creating estimate', {
        clientId: validatedInput.client_id,
        subject: validatedInput.subject
      });
      
      const response: AxiosResponse = await this.client.post('/estimates', validatedInput);
      
      this.logger.info('Successfully created estimate', {
        estimateId: response.data.id,
        estimateNumber: response.data.number
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Create estimate validation failed:', error.errors);
        throw new Error('Invalid estimate input data');
      }
      throw error;
    }
  }

  async updateEstimate(input: UpdateEstimateInput): Promise<any> {
    try {
      const validatedInput = UpdateEstimateSchema.parse(input);
      const { id, ...updateData } = validatedInput;
      
      this.logger.debug('Updating estimate', {
        estimateId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response: AxiosResponse = await this.client.patch(`/estimates/${id}`, updateData);
      
      this.logger.info('Successfully updated estimate', {
        estimateId: response.data.id,
        estimateNumber: response.data.number
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Update estimate validation failed:', error.errors);
        throw new Error('Invalid estimate update data');
      }
      throw error;
    }
  }

  async deleteEstimate(estimateId: number): Promise<void> {
    try {
      this.logger.debug('Deleting estimate', { estimateId });
      await this.client.delete(`/estimates/${estimateId}`);
      this.logger.info('Successfully deleted estimate', { estimateId });
    } catch (error) {
      this.logger.error('Failed to delete estimate', { estimateId, error: (error as Error).message });
      throw error;
    }
  }
}