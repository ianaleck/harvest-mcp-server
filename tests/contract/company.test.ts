/**
 * Company Tool Contract Tests
 */

import '../matchers/harvest-matchers';
import { HarvestMockServer } from '../mocks/harvest-mock-server';

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
      expect(result.content).toBeDefined();
      expect(result.content.id).toHaveValidHarvestId();
      expect(result.content.name).toBe('Mock Harvest Company');
      expect(result.content.is_active).toBe(true);
      expect(result.content.time_format).toBe('decimal');
      expect(result.content.weekly_capacity).toBeWithinRange(0, 168);
    });

    it('should validate response schema', async () => {
      const companyTools = harvestServer.getToolsByCategory('company');
      const getCompanyTool = companyTools.find((tool: any) => tool.name === 'get_company');

      const result = await getCompanyTool.execute({});
      const { CompanySchema } = await import('../../src/schemas/company');

      // Should not throw validation error
      expect(() => CompanySchema.parse(result.content)).not.toThrow();

      const validatedData = CompanySchema.parse(result.content);
      
      expect(validatedData.id).toHaveValidHarvestId();
      expect(validatedData.name).toBeTruthy();
      expect(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
        .toContain(validatedData.week_start_day);
      expect(['decimal', 'hours_minutes']).toContain(validatedData.time_format);
      expect(validatedData.weekly_capacity).toBeWithinRange(0, 168);
      expect(validatedData.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(validatedData.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
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

      await expect(getCompanyTool.execute({})).rejects.toThrow(/authentication|invalid|401/i);

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

      await expect(getCompanyTool.execute({})).rejects.toThrow(/rate.?limit|429/i);

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
      expect(result1.content.id).toBe(1234567);

      // Should work with undefined
      const result2 = await getCompanyTool.execute(undefined);
      expect(result2.content.id).toBe(1234567);
    });

    it('should maintain consistent data across multiple calls', async () => {
      const companyTools = harvestServer.getToolsByCategory('company');
      const getCompanyTool = companyTools.find((tool: any) => tool.name === 'get_company');

      const result1 = await getCompanyTool.execute({});
      const result2 = await getCompanyTool.execute({});

      // Should return identical data
      expect(result1.content).toEqual(result2.content);
      expect(result1.content.id).toBe(result2.content.id);
      expect(result1.content.name).toBe(result2.content.name);
    });
  });

  describe('MCP Integration', () => {
    it('should handle tool discovery correctly', async () => {
      const tools = await harvestServer.listTools();
      expect(tools).toHaveLength(23); // 1 company + 8 time entry + 5 project + 9 task tools
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