/**
 * Company Tool Contract Tests
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

describe('Company Tool', () => {
  let mockServer: HarvestMockServer;
  let harvestServer: any;

  beforeAll(async () => {
    mockServer = new HarvestMockServer();
  });

  beforeEach(async () => {
    const { HarvestMCPServer } = await import('../../src/server');
    const { HarvestAPIClient } = await import('../../src/client/harvest-api');

    // Create mock HTTP client that mimics axios behavior
    const mockClient = {
      get: jest.fn().mockImplementation(async (url: string) => {
        const mockResponse = await mockServer.request({
          method: 'GET',
          url: `https://api.harvestapp.com/v2${url}`,
          headers: {
            'Authorization': 'Bearer valid-token',
            'Harvest-Account-Id': 'valid-account-id'
          }
        });
        
        // Simulate axios response structure
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

    // Create server with mock client
    harvestServer = new HarvestMCPServer({
      harvest: {
        accessToken: 'valid-token',
        accountId: 'valid-account-id',
      }
    });

    // Replace the HTTP client with our mock
    harvestServer.harvestClient = new HarvestAPIClient({
      accessToken: 'valid-token',
      accountId: 'valid-account-id',
      httpClient: mockClient
    });
  });

  afterEach(async () => {
    if (harvestServer?.close) {
      await harvestServer.close();
    }
    mockServer.reset();
  });

  describe('get_company tool', () => {
    it('should successfully retrieve company information', async () => {
      const companyTools = harvestServer.getToolsByCategory('company');
      const getCompanyTool = companyTools.find((tool: any) => tool.name === 'get_company');

      expect(getCompanyTool).toBeDefined();

      const result = await getCompanyTool.execute({});
      
      expect(result).toBeDefined();
      expect(result.id).toHaveValidHarvestId();
      expect(result.name).toBe('Mock Harvest Company');
      expect(result.is_active).toBe(true);
      expect(result.time_format).toBe('decimal');
      expect(result.weekly_capacity).toBeWithinRange(0, 168);
    });

    it('should return raw company data without schema validation', async () => {
      const companyTools = harvestServer.getToolsByCategory('company');
      const getCompanyTool = companyTools.find((tool: any) => tool.name === 'get_company');

      const result = await getCompanyTool.execute({});
      
      // Test that we get basic expected fields without validating schema
      expect(result.id).toHaveValidHarvestId();
      expect(result.name).toBeTruthy();
      expect(typeof result.is_active).toBe('boolean');
      expect(typeof result.weekly_capacity).toBe('number');
      expect(result.created_at).toBeTruthy();
      expect(result.updated_at).toBeTruthy();
    });

    it('should handle authentication errors', async () => {
      const { HarvestMCPServer } = await import('../../src/server');
      const { HarvestAPIClient } = await import('../../src/client/harvest-api');

      // Create mock client that returns 401
      const mockClient = {
        get: jest.fn().mockImplementation(async () => {
          const mockResponse = await mockServer.request({
            method: 'GET',
            url: 'https://api.harvestapp.com/v2/company',
            headers: {
              'Authorization': 'Bearer invalid-token',
              'Harvest-Account-Id': 'invalid-account'
            }
          });
          
          // For error responses, axios would throw
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
            headers: mockResponse.headers || {}
          };
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };

      const invalidServer = new HarvestMCPServer({
        harvest: {
          accessToken: 'invalid-token',
          accountId: 'invalid-account',
        }
      });

      invalidServer.harvestClient = new HarvestAPIClient({
        accessToken: 'invalid-token',
        accountId: 'invalid-account',
        httpClient: mockClient
      });

      const companyTools = invalidServer.getToolsByCategory('company');
      const getCompanyTool = companyTools.find((tool: any) => tool.name === 'get_company');

      const result = await getCompanyTool.execute({});
      expectToolError(result, '401');

      if (invalidServer?.close) {
        await invalidServer.close();
      }
    });

    it('should handle rate limiting', async () => {
      const { HarvestMCPServer } = await import('../../src/server');
      const { HarvestAPIClient } = await import('../../src/client/harvest-api');

      // Create mock client that returns 429
      const rateLimitMockClient = {
        get: jest.fn().mockImplementation(async () => {
          const error = new Error('HTTP 429');
          (error as any).response = {
            status: 429,
            data: {
              error: "rate_limit_exceeded",
              error_description: "Too many requests"
            },
            headers: { 'Retry-After': '60' }
          };
          throw error;
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };

      const rateLimitServer = new HarvestMCPServer({
        harvest: {
          accessToken: 'valid-token',
          accountId: 'valid-account-id',
        }
      });

      rateLimitServer.harvestClient = new HarvestAPIClient({
        accessToken: 'valid-token',
        accountId: 'valid-account-id',
        httpClient: rateLimitMockClient
      });

      const companyTools = rateLimitServer.getToolsByCategory('company');
      const getCompanyTool = companyTools.find((tool: any) => tool.name === 'get_company');

      const result = await getCompanyTool.execute({});
      expectToolError(result, '429');

      if (rateLimitServer?.close) {
        await rateLimitServer.close();
      }
    });

    it('should be properly registered in MCP server', async () => {
      const allTools = await harvestServer.listTools();
      const companyTool = allTools.find((tool: any) => tool.name === 'get_company');

      expect(companyTool).toBeDefined();
      expect(companyTool.name).toBe('get_company');
      expect(companyTool.description).toContain('company information');
      expect(companyTool.inputSchema).toEqual({
        type: 'object',
        properties: {},
        additionalProperties: false
      });
    });

    it('should handle empty input correctly', async () => {
      const companyTools = harvestServer.getToolsByCategory('company');
      const getCompanyTool = companyTools.find((tool: any) => tool.name === 'get_company');

      // Should work with empty object
      const result1 = await getCompanyTool.execute({});
      expect(result1.id).toBe(1234567);

      // Should work with undefined
      const result2 = await getCompanyTool.execute(undefined);
      expect(result2.id).toBe(1234567);
    });

    it('should maintain consistent data across multiple calls', async () => {
      const companyTools = harvestServer.getToolsByCategory('company');
      const getCompanyTool = companyTools.find((tool: any) => tool.name === 'get_company');

      const result1 = await getCompanyTool.execute({});
      const result2 = await getCompanyTool.execute({});

      // Should return identical data
      expect(result1).toEqual(result2);
      expect(result1.id).toBe(result2.id);
      expect(result1.name).toBe(result2.name);
    });
  });

  describe('MCP Integration', () => {
    it('should handle tool discovery correctly', async () => {
      const tools = await harvestServer.listTools();
      expect(tools).toHaveLength(54); // Complete Harvest MCP server with all registered tools
      expect(tools[0].name).toBe('get_company');
    });

    it('should return tools by category', () => {
      const companyTools = harvestServer.getToolsByCategory('company');
      expect(companyTools).toHaveLength(1);
      
      const otherTools = harvestServer.getToolsByCategory('nonexistent');
      expect(otherTools).toHaveLength(0);
    });
  });
});