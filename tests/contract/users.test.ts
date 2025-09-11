/**
 * User Tools Contract Tests
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

describe('User Tools', () => {
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

  describe('list_users tool', () => {
    it('should successfully list users', async () => {
      const userTools = harvestServer.getToolsByCategory('users');
      expect(userTools.length).toBe(6); // Should be 6 user tools
      
      const listUsersTool = userTools.find((tool: any) => tool.name === 'list_users');
      expect(listUsersTool).toBeDefined();

      const result = await listUsersTool.execute({ per_page: 2000 });
      
      expect(result).toBeDefined();
      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
    });

    it('should validate query parameters', async () => {
      const userTools = harvestServer.getToolsByCategory('users');
      const listUsersTool = userTools.find((tool: any) => tool.name === 'list_users');

      const result = await listUsersTool.execute({
        is_active: 'invalid', // Should be boolean
      });
      expectToolError(result, 'Invalid parameters');
    });
  });

  describe('get_user tool', () => {
    it('should successfully retrieve a specific user', async () => {
      const userTools = harvestServer.getToolsByCategory('users');
      const getUserTool = userTools.find((tool: any) => tool.name === 'get_user');

      const result = await getUserTool.execute({ user_id: 1782959 });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1782959);
      expect(result.first_name).toBeTruthy();
      expect(result.last_name).toBeTruthy();
    });

    it('should validate required parameters', async () => {
      const userTools = harvestServer.getToolsByCategory('users');
      const getUserTool = userTools.find((tool: any) => tool.name === 'get_user');

      const result = await getUserTool.execute({});
      expectToolError(result, 'Invalid parameters');
    });
  });

  describe('get_current_user tool', () => {
    it('should successfully retrieve current user', async () => {
      const userTools = harvestServer.getToolsByCategory('users');
      const getCurrentUserTool = userTools.find((tool: any) => tool.name === 'get_current_user');

      const result = await getCurrentUserTool.execute({});
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1782959);
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Developer');
    });
  });

  describe('create_user tool', () => {
    it('should successfully create a user', async () => {
      const userTools = harvestServer.getToolsByCategory('users');
      const createUserTool = userTools.find((tool: any) => tool.name === 'create_user');

      const result = await createUserTool.execute({
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        is_active: true
      });
      
      expect(result).toBeDefined();
      expect(result.id).toHaveValidHarvestId();
      expect(result.first_name).toBe('Jane');
      expect(result.last_name).toBe('Designer');
    });

    it('should validate required parameters', async () => {
      const userTools = harvestServer.getToolsByCategory('users');
      const createUserTool = userTools.find((tool: any) => tool.name === 'create_user');

      const result = await createUserTool.execute({});
      expectToolError(result, 'Invalid parameters');
    });
  });

  describe('update_user tool', () => {
    it('should successfully update a user', async () => {
      const userTools = harvestServer.getToolsByCategory('users');
      const updateUserTool = userTools.find((tool: any) => tool.name === 'update_user');

      const result = await updateUserTool.execute({
        id: 1782959,
        first_name: 'Updated',
        last_name: 'Name'
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1782959);
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Senior Developer');
    });

    it('should validate required parameters', async () => {
      const userTools = harvestServer.getToolsByCategory('users');
      const updateUserTool = userTools.find((tool: any) => tool.name === 'update_user');

      const result = await updateUserTool.execute({});
      expectToolError(result, 'Invalid parameters');
    });
  });

  describe('delete_user tool', () => {
    it('should successfully delete a user', async () => {
      const userTools = harvestServer.getToolsByCategory('users');
      const deleteUserTool = userTools.find((tool: any) => tool.name === 'delete_user');

      const result = await deleteUserTool.execute({ user_id: 1782959 });
      
      expect(result).toBeDefined();
      expect(result.message).toContain('deleted');
    });
  });

  describe('MCP Integration', () => {
    it('should return all user tools by category', async () => {
      const userTools = harvestServer.getToolsByCategory('users');
      
      expect(userTools).toHaveLength(6);
      
      const toolNames = userTools.map((tool: any) => tool.name);
      expect(toolNames).toContain('list_users');
      expect(toolNames).toContain('get_user');
      expect(toolNames).toContain('get_current_user');
      expect(toolNames).toContain('create_user');
      expect(toolNames).toContain('update_user');
      expect(toolNames).toContain('delete_user');
    });
  });
});