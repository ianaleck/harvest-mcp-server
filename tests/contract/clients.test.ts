/**
 * Client Tools Contract Tests
 */

import '../matchers/harvest-matchers';
import { HarvestMockServer } from '../mocks/harvest-mock-server';

describe('Client Tools', () => {
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
            'Authorization': 'Bearer test_token_12345',
            'Harvest-Account-Id': '123456'
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
          (error as any).config = { url };
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

    // Create server with mock client
    harvestServer = new HarvestMCPServer({
      harvest: {
        accessToken: 'test_token_12345',
        accountId: '123456',
      }
    });

    // Replace the HTTP client with our mock
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

  describe('list_clients tool', () => {
    it('should successfully list clients', async () => {
      const clientTools = harvestServer.getToolsByCategory('clients');
      expect(clientTools.length).toBe(5); // Should be 5 client tools
      
      const listClientsTool = clientTools.find((tool: any) => tool.name === 'list_clients');
      expect(listClientsTool).toBeDefined();

      const result = await listClientsTool.execute({});
      
      expect(result).toBeDefined();
      expect(result.clients).toBeDefined();
      expect(Array.isArray(result.clients)).toBe(true);
      expect(result.clients).toHaveLength(1);
      
      const client = result.clients[0];
      expect(client.id).toHaveValidHarvestId();
      expect(client.name).toBeTruthy();
      expect(typeof client.is_active).toBe('boolean');
      expect(client.currency).toBeValidCurrencyCode();
    });

    it('should handle query parameters correctly', async () => {
      const clientTools = harvestServer.getToolsByCategory('clients');
      const listClientsTool = clientTools.find((tool: any) => tool.name === 'list_clients');

      const result = await listClientsTool.execute({
        is_active: true,
        per_page: 50
      });
      
      expect(result).toBeDefined();
      expect(result.clients).toBeDefined();
      expect(result.per_page).toBe(2000);
      expect(result.page).toBe(1);
    });

    it('should validate query parameters with Zod', async () => {
      const clientTools = harvestServer.getToolsByCategory('clients');
      const listClientsTool = clientTools.find((tool: any) => tool.name === 'list_clients');

      await expect(listClientsTool.execute({
        per_page: 'invalid', // Should be number
      })).rejects.toThrow('Invalid parameters');
    });
  });

  describe('get_client tool', () => {
    it('should successfully retrieve a specific client', async () => {
      const clientTools = harvestServer.getToolsByCategory('clients');
      const getClientTool = clientTools.find((tool: any) => tool.name === 'get_client');

      const result = await getClientTool.execute({ client_id: 5735776 });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(5735776);
      expect(result.name).toBe('Acme Corporation');
      expect(result.is_active).toBe(true);
      expect(result.currency).toBe('USD');
    });

    it('should handle not found errors', async () => {
      mockServer.responses.set('GET:/v2/clients/999999999', {
        status: 404,
        data: { error: 'not_found', error_description: 'Client not found' },
        headers: {}
      });

      const clientTools = harvestServer.getToolsByCategory('clients');
      const getClientTool = clientTools.find((tool: any) => tool.name === 'get_client');

      await expect(getClientTool.execute({ client_id: 999999999 }))
        .rejects.toThrow('HTTP 404');
    });

    it('should validate required client_id parameter', async () => {
      const clientTools = harvestServer.getToolsByCategory('clients');
      const getClientTool = clientTools.find((tool: any) => tool.name === 'get_client');

      await expect(getClientTool.execute({}))
        .rejects.toThrow('Invalid parameters');

      await expect(getClientTool.execute({ client_id: 'invalid' }))
        .rejects.toThrow('Invalid parameters');
    });
  });

  describe('create_client tool', () => {
    it('should successfully create a client', async () => {
      const clientTools = harvestServer.getToolsByCategory('clients');
      const createClientTool = clientTools.find((tool: any) => tool.name === 'create_client');

      const result = await createClientTool.execute({
        name: 'Test Client Inc',
        address: '123 Test Street\nTest City, TC 12345',
        currency: 'USD',
        is_active: true
      });
      
      expect(result).toBeDefined();
      expect(result.id).toHaveValidHarvestId();
      expect(result.name).toBe('New Client Corp');
      expect(result.currency).toBe('USD');
      expect(result.is_active).toBe(true);
    });

    it('should validate required parameters', async () => {
      const clientTools = harvestServer.getToolsByCategory('clients');
      const createClientTool = clientTools.find((tool: any) => tool.name === 'create_client');

      await expect(createClientTool.execute({}))
        .rejects.toThrow('Invalid parameters');

      await expect(createClientTool.execute({
        // Missing name
        currency: 'USD'
      })).rejects.toThrow('Invalid parameters');
    });
  });

  describe('update_client tool', () => {
    it('should successfully update a client', async () => {
      const clientTools = harvestServer.getToolsByCategory('clients');
      const updateClientTool = clientTools.find((tool: any) => tool.name === 'update_client');

      const result = await updateClientTool.execute({
        id: 5735776,
        name: 'Updated Acme Corporation',
        is_active: true
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(5735776);
      expect(result.name).toBe('Updated Acme Corporation');
      expect(result.is_active).toBe(true);
    });

    it('should validate required id parameter', async () => {
      const clientTools = harvestServer.getToolsByCategory('clients');
      const updateClientTool = clientTools.find((tool: any) => tool.name === 'update_client');

      await expect(updateClientTool.execute({
        name: 'Test'
        // Missing id
      })).rejects.toThrow('Invalid parameters');
    });
  });

  describe('delete_client tool', () => {
    it('should successfully delete a client', async () => {
      const clientTools = harvestServer.getToolsByCategory('clients');
      const deleteClientTool = clientTools.find((tool: any) => tool.name === 'delete_client');

      const result = await deleteClientTool.execute({ client_id: 5735776 });
      
      expect(result).toBeDefined();
      expect(result.message).toContain('deleted successfully');
    });

    it('should handle not found errors for delete', async () => {
      const clientTools = harvestServer.getToolsByCategory('clients');
      const deleteClientTool = clientTools.find((tool: any) => tool.name === 'delete_client');

      await expect(deleteClientTool.execute({ client_id: 999999999 }))
        .rejects.toThrow('HTTP 404');
    });
  });

  describe('MCP Integration', () => {
    it('should return all client tools by category', async () => {
      const clientTools = harvestServer.getToolsByCategory('clients');
      
      expect(clientTools).toHaveLength(5);
      
      const toolNames = clientTools.map((tool: any) => tool.name);
      expect(toolNames).toContain('list_clients');
      expect(toolNames).toContain('get_client');
      expect(toolNames).toContain('create_client');
      expect(toolNames).toContain('update_client');
      expect(toolNames).toContain('delete_client');
    });

    it('should have proper tool descriptions and schemas', async () => {
      const tools = await harvestServer.listTools();
      const clientTools = tools.filter((tool: any) => 
        tool.name.includes('client')
      );
      
      expect(clientTools).toHaveLength(5);
      
      clientTools.forEach((tool: any) => {
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
      });
    });
  });
});