/**
 * Task Tools Contract Tests
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

describe('Task Tools', () => {
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

  describe('list_tasks tool', () => {
    it('should successfully list tasks', async () => {
      const taskTools = harvestServer.getToolsByCategory('tasks');
      expect(taskTools.length).toBe(5); // Should be 5 task tools
      
      const listTasksTool = taskTools.find((tool: any) => tool.name === 'list_tasks');
      expect(listTasksTool).toBeDefined();

      const result = await listTasksTool.execute({});
      
      expect(result).toBeDefined();
      expect(result.tasks).toBeDefined();
      expect(Array.isArray(result.tasks)).toBe(true);
      expect(result.tasks.length).toBeGreaterThan(0);
      
      const task = result.tasks[0];
      expect(task.id).toHaveValidHarvestId();
      expect(task.name).toBeTruthy();
      expect(typeof task.is_active).toBe('boolean');
    });

    it('should handle query parameters correctly', async () => {
      const taskTools = harvestServer.getToolsByCategory('tasks');
      const listTasksTool = taskTools.find((tool: any) => tool.name === 'list_tasks');

      const result = await listTasksTool.execute({
        is_active: true,
        per_page: 50
      });
      
      expect(result).toBeDefined();
      expect(result.tasks).toBeDefined();
      expect(result.per_page).toBe(2000);
      expect(result.page).toBe(1);
    });

    it('should validate query parameters with Zod', async () => {
      const taskTools = harvestServer.getToolsByCategory('tasks');
      const listTasksTool = taskTools.find((tool: any) => tool.name === 'list_tasks');

      const result = await listTasksTool.execute({
        is_active: 'invalid', // Should be boolean
      });
      expectToolError(result, 'Invalid parameters');
    });
  });

  describe('get_task tool', () => {
    it('should successfully retrieve a specific task', async () => {
      const taskTools = harvestServer.getToolsByCategory('tasks');
      const getTaskTool = taskTools.find((tool: any) => tool.name === 'get_task');

      const result = await getTaskTool.execute({ task_id: 8083365 });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(8083365);
      expect(result.name).toBe('Development');
      expect(result.is_active).toBe(true);
      expect(typeof result.billable_by_default).toBe('boolean');
      expect(typeof result.is_default).toBe('boolean');
    });

    it('should handle not found errors', async () => {
      mockServer.responses.set('GET:/v2/tasks/999999999', {
        status: 404,
        data: { error: 'not_found', error_description: 'Task not found' },
        headers: {}
      });

      const taskTools = harvestServer.getToolsByCategory('tasks');
      const getTaskTool = taskTools.find((tool: any) => tool.name === 'get_task');

      const result = await getTaskTool.execute({ task_id: 999999999 });
      expectToolError(result, 'HTTP 404');
    });

    it('should validate required task_id parameter', async () => {
      const taskTools = harvestServer.getToolsByCategory('tasks');
      const getTaskTool = taskTools.find((tool: any) => tool.name === 'get_task');

      const result1 = await getTaskTool.execute({});
      expectToolError(result1, 'Invalid parameters');

      const result2 = await getTaskTool.execute({ task_id: 'invalid' });
      expectToolError(result2, 'Invalid parameters');
    });
  });

  describe('create_task tool', () => {
    it('should successfully create a task', async () => {
      const taskTools = harvestServer.getToolsByCategory('tasks');
      const createTaskTool = taskTools.find((tool: any) => tool.name === 'create_task');

      const result = await createTaskTool.execute({
        name: 'Test Task',
        is_active: true,
        billable_by_default: true,
        default_hourly_rate: 100.0
      });
      
      expect(result).toBeDefined();
      expect(result.id).toHaveValidHarvestId();
      expect(result.name).toBe('New Task');
      expect(result.is_active).toBe(true);
      expect(result.billable_by_default).toBe(true);
      expect(result.default_hourly_rate).toBeNull();
    });

    it('should validate required parameters', async () => {
      const taskTools = harvestServer.getToolsByCategory('tasks');
      const createTaskTool = taskTools.find((tool: any) => tool.name === 'create_task');

      const result1 = await createTaskTool.execute({});
      expectToolError(result1, 'Invalid parameters');

      const result2 = await createTaskTool.execute({
        // Missing name
        is_active: true
      });
      expectToolError(result2, 'Invalid parameters');
    });
  });

  describe('update_task tool', () => {
    it('should successfully update a task', async () => {
      const taskTools = harvestServer.getToolsByCategory('tasks');
      const updateTaskTool = taskTools.find((tool: any) => tool.name === 'update_task');

      const result = await updateTaskTool.execute({
        id: 8083365,
        name: 'Updated Task Name',
        is_active: false,
        default_hourly_rate: 125.0
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(8083365);
      expect(result.name).toBe('Updated Development');
      expect(result.is_active).toBe(true);
      expect(result.default_hourly_rate).toBe(110.0);
    });

    it('should validate required id parameter', async () => {
      const taskTools = harvestServer.getToolsByCategory('tasks');
      const updateTaskTool = taskTools.find((tool: any) => tool.name === 'update_task');

      const result = await updateTaskTool.execute({
        name: 'Test'
        // Missing id
      });
      expectToolError(result, 'Invalid parameters');
    });
  });

  describe('delete_task tool', () => {
    it('should successfully delete a task', async () => {
      const taskTools = harvestServer.getToolsByCategory('tasks');
      const deleteTaskTool = taskTools.find((tool: any) => tool.name === 'delete_task');

      const result = await deleteTaskTool.execute({ task_id: 8083365 });
      
      expect(result).toBeDefined();
      expect(result.message).toContain('deleted successfully');
    });

    it('should handle not found errors for delete', async () => {
      const taskTools = harvestServer.getToolsByCategory('tasks');
      const deleteTaskTool = taskTools.find((tool: any) => tool.name === 'delete_task');

      const result = await deleteTaskTool.execute({ task_id: 999999999 });
      expectToolError(result, 'HTTP 404');
    });
  });

  describe('MCP Integration', () => {
    it('should return all task tools by category', async () => {
      const taskTools = harvestServer.getToolsByCategory('tasks');
      
      expect(taskTools).toHaveLength(5);
      
      const toolNames = taskTools.map((tool: any) => tool.name);
      expect(toolNames).toContain('list_tasks');
      expect(toolNames).toContain('get_task');
      expect(toolNames).toContain('create_task');
      expect(toolNames).toContain('update_task');
      expect(toolNames).toContain('delete_task');
    });

    it('should have proper tool descriptions and schemas', async () => {
      const tools = await harvestServer.listTools();
      const taskTools = tools.filter((tool: any) => 
        tool.name.includes('task') && !tool.name.includes('project')
      );
      
      expect(taskTools).toHaveLength(5);
      
      taskTools.forEach((tool: any) => {
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
      });
    });
  });
});