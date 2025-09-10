/**
 * Invoice Tools Contract Tests
 */

import '../matchers/harvest-matchers';
import { HarvestMockServer } from '../mocks/harvest-mock-server';

describe('Invoice Tools', () => {
  let mockServer: HarvestMockServer;
  let harvestServer: any;

  beforeAll(async () => {
    mockServer = new HarvestMockServer();
  });

  beforeEach(async () => {
    const { HarvestMCPServer } = await import('../../src/server');
    const { HarvestAPIClient } = await import('../../src/client/harvest-api');

    const mockClient = {
      get: jest.fn().mockImplementation(async (url: string) => {
        const mockResponse = await mockServer.request({
          method: 'GET',
          url: `https://api.harvestapp.com/v2${url}`,
          headers: {
            'Authorization': 'Bearer test_token_12345',
            'Harvest-Account-Id': '123456'
          }
        });
        
        if (mockResponse.status >= 400) {
          const error = new Error(`HTTP ${mockResponse.status}`);
          (error as any).response = {
            status: mockResponse.status,
            data: mockResponse.data,
            headers: mockResponse.headers || {}
          };
          throw error;
        }
        
        return {
          status: mockResponse.status,
          data: mockResponse.data,
          headers: mockResponse.headers || {},
          config: { url }
        };
      }),
      post: jest.fn().mockImplementation(async (url: string, data: any) => {
        const mockResponse = await mockServer.request({
          method: 'POST',
          url: `https://api.harvestapp.com/v2${url}`,
          headers: {
            'Authorization': 'Bearer test_token_12345',
            'Harvest-Account-Id': '123456'
          },
          data: data
        });
        
        if (mockResponse.status >= 400) {
          const error = new Error(`HTTP ${mockResponse.status}`);
          (error as any).response = {
            status: mockResponse.status,
            data: mockResponse.data,
            headers: mockResponse.headers || {}
          };
          throw error;
        }
        
        return {
          status: mockResponse.status,
          data: mockResponse.data,
          headers: mockResponse.headers || {},
          config: { url }
        };
      }),
      patch: jest.fn().mockImplementation(async (url: string, data?: any) => {
        const mockResponse = await mockServer.request({
          method: 'PATCH',
          url: `https://api.harvestapp.com/v2${url}`,
          headers: {
            'Authorization': 'Bearer test_token_12345',
            'Harvest-Account-Id': '123456'
          },
          data: data
        });
        
        if (mockResponse.status >= 400) {
          const error = new Error(`HTTP ${mockResponse.status}`);
          (error as any).response = {
            status: mockResponse.status,
            data: mockResponse.data,
            headers: mockResponse.headers || {}
          };
          throw error;
        }
        
        return {
          status: mockResponse.status,
          data: mockResponse.data,
          headers: mockResponse.headers || {},
          config: { url }
        };
      }),
      delete: jest.fn().mockImplementation(async (url: string) => {
        const mockResponse = await mockServer.request({
          method: 'DELETE',
          url: `https://api.harvestapp.com/v2${url}`,
          headers: {
            'Authorization': 'Bearer test_token_12345',
            'Harvest-Account-Id': '123456'
          }
        });
        
        if (mockResponse.status >= 400) {
          const error = new Error(`HTTP ${mockResponse.status}`);
          (error as any).response = {
            status: mockResponse.status,
            data: mockResponse.data,
            headers: mockResponse.headers || {}
          };
          throw error;
        }
        
        return {
          status: mockResponse.status,
          data: mockResponse.data,
          headers: mockResponse.headers || {},
          config: { url }
        };
      }),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    harvestServer = new HarvestMCPServer({
      harvest: {
        accessToken: 'test_token_12345',
        accountId: '123456',
      }
    });

    harvestServer.harvestClient = new HarvestAPIClient({
      accessToken: 'test_token_12345',
      accountId: '123456',
      httpClient: mockClient
    });
  });

  afterEach(async () => {
    if (harvestServer?.close) {
      await harvestServer.close();
    }
    mockServer.reset();
  });

  describe('MCP Integration', () => {
    it('should return all invoice tools by category', async () => {
      const invoiceTools = harvestServer.getToolsByCategory('invoices');
      
      expect(invoiceTools).toHaveLength(5);
      
      const toolNames = invoiceTools.map((tool: any) => tool.name);
      expect(toolNames).toContain('list_invoices');
      expect(toolNames).toContain('get_invoice');
      expect(toolNames).toContain('create_invoice');
      expect(toolNames).toContain('update_invoice');
      expect(toolNames).toContain('delete_invoice');
    });
  });

  describe('list_invoices tool', () => {
    it('should successfully list invoices', async () => {
      const invoiceTools = harvestServer.getToolsByCategory('invoices');
      const listInvoicesTool = invoiceTools.find((tool: any) => tool.name === 'list_invoices');
      expect(listInvoicesTool).toBeDefined();

      const result = await listInvoicesTool.execute({ per_page: 2000 });
      
      expect(result).toBeDefined();
      expect(result.invoices).toBeDefined();
      expect(Array.isArray(result.invoices)).toBe(true);
    });
  });

  describe('get_invoice tool', () => {
    it('should successfully retrieve a specific invoice', async () => {
      const invoiceTools = harvestServer.getToolsByCategory('invoices');
      const getInvoiceTool = invoiceTools.find((tool: any) => tool.name === 'get_invoice');

      const result = await getInvoiceTool.execute({ invoice_id: 13150378 });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(13150378);
    });
  });

  describe('create_invoice tool', () => {
    it('should successfully create an invoice', async () => {
      const invoiceTools = harvestServer.getToolsByCategory('invoices');
      const createInvoiceTool = invoiceTools.find((tool: any) => tool.name === 'create_invoice');

      const result = await createInvoiceTool.execute({
        client_id: 5735776,
        subject: 'Test Invoice',
        currency: 'USD'
      });
      
      expect(result).toBeDefined();
      expect(result.id).toHaveValidHarvestId();
    });
  });
});