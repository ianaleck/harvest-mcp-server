import { AxiosResponse } from 'axios';
import { BaseHarvestClient, HarvestAPIOptions } from './base-client';

export class CompanyClient extends BaseHarvestClient {
  constructor(options: HarvestAPIOptions) {
    super(options, 'company-client');
  }

  async getCompany(): Promise<any> {
    try {
      const response: AxiosResponse = await this.client.get('/company');
      
      this.logger.debug('Raw API response:', { 
        status: response.status, 
        data: response.data,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      
      this.logger.info('Successfully retrieved company information', {
        companyId: response.data.id,
        companyName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to retrieve company information', { error: (error as Error).message });
      throw error;
    }
  }
}