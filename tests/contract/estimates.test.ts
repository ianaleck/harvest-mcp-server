/**
 * Estimate Tools Contract Tests
 */

import '../matchers/harvest-matchers';
import { HarvestMockServer } from '../mocks/harvest-mock-server';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Helper function to check if a tool result is an error
function expectToolError(result: CallToolResult, expectedMessage?: string): void {
  expect(result).toHaveProperty('isError', true);
  expect(result).toHaveProperty('content');
  expect(Array.isArray(result.content)).toBe(true);
  expect(result.content[0]).toHaveProperty('type', 'text');
  if (expectedMessage) {
    expect(result.content[0].text).toContain(expectedMessage);
  }
}

describe('Estimate Tools', () => {
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

  describe('list_estimates tool', () => {
    it('should successfully list estimates', async () => {
      const estimateTools = harvestServer.getToolsByCategory('estimates');
      expect(estimateTools.length).toBe(5); // Should be 5 estimate tools
      
      const listEstimatesTool = estimateTools.find((tool: any) => tool.name === 'list_estimates');
      expect(listEstimatesTool).toBeDefined();

      const result = await listEstimatesTool.execute({ per_page: 2000 });
      
      expect(result).toBeDefined();
      expect(result.estimates).toBeDefined();
      expect(Array.isArray(result.estimates)).toBe(true);
    });
  });

  describe('get_estimate tool', () => {
    it('should successfully retrieve a specific estimate', async () => {
      const estimateTools = harvestServer.getToolsByCategory('estimates');
      const getEstimateTool = estimateTools.find((tool: any) => tool.name === 'get_estimate');

      const result = await getEstimateTool.execute({ estimate_id: 1439814 });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1439814);
      expect(result.number).toBeTruthy();
    });
  });

  describe('create_estimate tool', () => {
    it('should successfully create an estimate', async () => {
      const estimateTools = harvestServer.getToolsByCategory('estimates');
      const createEstimateTool = estimateTools.find((tool: any) => tool.name === 'create_estimate');

      const result = await createEstimateTool.execute({
        client_id: 5735776,
        number: 'EST-001',
        purchase_order: 'PO-123',
        subject: 'Test Estimate'
      });
      
      expect(result).toBeDefined();
      expect(result.id).toHaveValidHarvestId();
      expect(result.number).toBe('EST-002');
    });
  });

  describe('update_estimate tool', () => {
    it('should successfully update an estimate', async () => {
      const estimateTools = harvestServer.getToolsByCategory('estimates');
      const updateEstimateTool = estimateTools.find((tool: any) => tool.name === 'update_estimate');

      const result = await updateEstimateTool.execute({
        id: 1439814,
        subject: 'Updated Subject'
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1439814);
      expect(result.subject).toBe('Updated Web Application Development Estimate');
    });
  });

  describe('delete_estimate tool', () => {
    it('should successfully delete an estimate', async () => {
      const estimateTools = harvestServer.getToolsByCategory('estimates');
      const deleteEstimateTool = estimateTools.find((tool: any) => tool.name === 'delete_estimate');

      const result = await deleteEstimateTool.execute({ estimate_id: 1439814 });
      
      expect(result).toBeDefined();
      expect(result.message).toContain('deleted');
    });
  });

  describe('MCP Integration', () => {
    it('should return all estimate tools by category', async () => {
      const estimateTools = harvestServer.getToolsByCategory('estimates');
      
      expect(estimateTools).toHaveLength(5);
      
      const toolNames = estimateTools.map((tool: any) => tool.name);
      expect(toolNames).toContain('list_estimates');
      expect(toolNames).toContain('get_estimate');
      expect(toolNames).toContain('create_estimate');
      expect(toolNames).toContain('update_estimate');
      expect(toolNames).toContain('delete_estimate');
    });
  });
});