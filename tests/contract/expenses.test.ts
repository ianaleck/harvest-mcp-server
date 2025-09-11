/**
 * Expense Tools Contract Tests
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

describe('Expense Tools', () => {
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
    it('should return all expense tools by category', async () => {
      const expenseTools = harvestServer.getToolsByCategory('expenses');
      
      expect(expenseTools).toHaveLength(6);
      
      const toolNames = expenseTools.map((tool: any) => tool.name);
      expect(toolNames).toContain('list_expenses');
      expect(toolNames).toContain('get_expense');
      expect(toolNames).toContain('create_expense');
      expect(toolNames).toContain('update_expense');
      expect(toolNames).toContain('delete_expense');
      expect(toolNames).toContain('list_expense_categories');
    });
  });

  describe('list_expenses tool', () => {
    it('should successfully list expenses', async () => {
      const expenseTools = harvestServer.getToolsByCategory('expenses');
      const listExpensesTool = expenseTools.find((tool: any) => tool.name === 'list_expenses');
      expect(listExpensesTool).toBeDefined();

      const result = await listExpensesTool.execute({ per_page: 2000 });
      
      expect(result).toBeDefined();
      expect(result.expenses).toBeDefined();
      expect(Array.isArray(result.expenses)).toBe(true);
    });
  });

  describe('get_expense tool', () => {
    it('should successfully retrieve a specific expense', async () => {
      const expenseTools = harvestServer.getToolsByCategory('expenses');
      const getExpenseTool = expenseTools.find((tool: any) => tool.name === 'get_expense');

      const result = await getExpenseTool.execute({ expense_id: 15296442 });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(15296442);
    });
  });

  describe('create_expense tool', () => {
    it('should successfully create an expense', async () => {
      const expenseTools = harvestServer.getToolsByCategory('expenses');
      const createExpenseTool = expenseTools.find((tool: any) => tool.name === 'create_expense');

      const result = await createExpenseTool.execute({
        project_id: 14307913,
        expense_category_id: 4195926,
        spent_date: '2025-01-01',
        total_cost: 100,
        billable: true
      });
      
      expect(result).toBeDefined();
      expect(result.id).toHaveValidHarvestId();
    });
  });

  describe('list_expense_categories tool', () => {
    it('should successfully list expense categories', async () => {
      const expenseTools = harvestServer.getToolsByCategory('expenses');
      const listCategoresTool = expenseTools.find((tool: any) => tool.name === 'list_expense_categories');

      const result = await listCategoresTool.execute({ per_page: 2000 });
      
      expect(result).toBeDefined();
      expect(result.expense_categories).toBeDefined();
      expect(Array.isArray(result.expense_categories)).toBe(true);
    });
  });
});