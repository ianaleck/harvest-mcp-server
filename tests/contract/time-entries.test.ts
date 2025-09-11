/**
 * Time Entry Tools Contract Tests
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

describe('Time Entry Tools', () => {
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
        
        // Simulate axios response structure
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
      delete: jest.fn().mockImplementation(async (url: string) => {
        const mockResponse = await mockServer.request({
          method: 'DELETE',
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

  describe('list_time_entries tool', () => {
    it('should successfully list time entries', async () => {
      // First check if tools are registered at all
      const allTools = await harvestServer.listTools();
      expect(allTools.length).toBe(54); // Complete Harvest MCP server with all registered tools
      
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      expect(timeEntryTools.length).toBe(8); // Should be 8 time entry tools
      
      const listTimeEntriesInTool = timeEntryTools.find((tool: any) => tool.name === 'list_time_entries');
      expect(listTimeEntriesInTool).toBeDefined();

      const result = await listTimeEntriesInTool.execute({});
      
      expect(result).toBeDefined();
      expect(result.time_entries).toBeDefined();
      expect(Array.isArray(result.time_entries)).toBe(true);
      expect(result.time_entries).toHaveLength(1);
      
      const timeEntry = result.time_entries[0];
      expect(timeEntry.id).toHaveValidHarvestId();
      expect(timeEntry.spent_date).toBeValidDateString();
      expect(timeEntry.hours).toBeValidDecimalHours();
      expect(timeEntry.started_time).toBeValidTimeString();
      expect(timeEntry.ended_time).toBeValidTimeString();
    });

    it('should handle query parameters correctly', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const listTimeEntriesInTool = timeEntryTools.find((tool: any) => tool.name === 'list_time_entries');

      const result = await listTimeEntriesInTool.execute({
        user_id: 1782959,
        from: '2025-09-01',
        to: '2025-09-30',
        is_running: false
      });
      
      expect(result).toBeDefined();
      expect(result.time_entries).toBeDefined();
      expect(result.per_page).toBe(2000);
      expect(result.page).toBe(1);
    });

    it('should validate query parameters with Zod', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const listTimeEntriesInTool = timeEntryTools.find((tool: any) => tool.name === 'list_time_entries');

      const result1 = await listTimeEntriesInTool.execute({
        user_id: 'invalid', // Should be number
      });
      expectToolError(result1, 'Invalid parameters');

      const result2 = await listTimeEntriesInTool.execute({
        from: 'invalid-date', // Should be YYYY-MM-DD
      });
      expectToolError(result2, 'Invalid parameters');
    });

    it('should be properly registered in MCP server', async () => {
      const tools = await harvestServer.listTools();
      const listTimeEntriesInTool = tools.find((tool: any) => tool.name === 'list_time_entries');
      
      expect(listTimeEntriesInTool).toBeDefined();
      expect(listTimeEntriesInTool.description).toContain('list of time entries');
      expect(listTimeEntriesInTool.inputSchema.properties).toHaveProperty('user_id');
      expect(listTimeEntriesInTool.inputSchema.properties).toHaveProperty('project_id');
      expect(listTimeEntriesInTool.inputSchema.properties).toHaveProperty('from');
      expect(listTimeEntriesInTool.inputSchema.properties).toHaveProperty('to');
    });
  });

  describe('get_time_entry tool', () => {
    it('should successfully retrieve a specific time entry', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const getTimeEntryTool = timeEntryTools.find((tool: any) => tool.name === 'get_time_entry');

      expect(getTimeEntryTool).toBeDefined();

      const result = await getTimeEntryTool.execute({ time_entry_id: 636709355 });
      
      expect(result).toBeDefined();
      expect(result.id).toHaveValidHarvestId();
      expect(result.spent_date).toBeValidDateString();
      expect(result.hours).toBeValidDecimalHours();
      expect(result.user.id).toHaveValidHarvestId();
      expect(result.project.id).toHaveValidHarvestId();
      expect(result.task.id).toHaveValidHarvestId();
      expect(result.client.currency).toBeValidCurrencyCode();
    });

    it('should handle not found errors', async () => {
      // Mock server setup for error response in mock-server.ts
      mockServer.responses.set('GET:/v2/time_entries/999999999', {
        status: 404,
        data: { error: 'not_found', error_description: 'Time entry not found' },
        headers: {}
      });

      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const getTimeEntryTool = timeEntryTools.find((tool: any) => tool.name === 'get_time_entry');

      const result = await getTimeEntryTool.execute({ time_entry_id: 999999999 });
      expectToolError(result, 'HTTP 404');
    });

    it('should validate required time_entry_id parameter', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const getTimeEntryTool = timeEntryTools.find((tool: any) => tool.name === 'get_time_entry');

      const result = await getTimeEntryTool.execute({});
      expectToolError(result, 'Invalid parameters');

      const result2 = await getTimeEntryTool.execute({ time_entry_id: 'invalid' });
      expectToolError(result2, 'Invalid parameters');
    });
  });

  describe('create_time_entry tool', () => {
    it('should successfully create a time entry with hours', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const createTimeEntryTool = timeEntryTools.find((tool: any) => tool.name === 'create_time_entry');

      expect(createTimeEntryTool).toBeDefined();

      const result = await createTimeEntryTool.execute({
        project_id: 14307913,
        task_id: 8083365,
        spent_date: '2025-09-10',
        hours: 2.5,
        notes: 'Code review and testing'
      });
      
      expect(result).toBeDefined();
      expect(result.id).toHaveValidHarvestId();
      expect(result.hours).toBeValidDecimalHours();
      expect(result.project.id).toBe(14307913);
      expect(result.task.id).toBe(8083365);
    });

    it('should successfully create a time entry with start/end times', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const createTimeEntryTool = timeEntryTools.find((tool: any) => tool.name === 'create_time_entry');

      const result = await createTimeEntryTool.execute({
        project_id: 14307913,
        task_id: 8083365,
        spent_date: '2025-09-10',
        started_time: '09:00',
        ended_time: '11:30',
        notes: 'Morning development work'
      });
      
      expect(result).toBeDefined();
      expect(result.started_time).toBeValidTimeString();
      expect(result.ended_time).toBeValidTimeString();
    });

    it('should validate required parameters', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const createTimeEntryTool = timeEntryTools.find((tool: any) => tool.name === 'create_time_entry');

      const result = await createTimeEntryTool.execute({});
      expectToolError(result, 'Invalid parameters');

      const result2 = await createTimeEntryTool.execute({
        project_id: 14307913,
        task_id: 8083365
        // Missing spent_date
      });
      expectToolError(result2, 'Invalid parameters');
    });

    it('should validate hours or time range requirement', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const createTimeEntryTool = timeEntryTools.find((tool: any) => tool.name === 'create_time_entry');

      const result = await createTimeEntryTool.execute({
        project_id: 14307913,
        task_id: 8083365,
        spent_date: '2025-09-10'
        // Missing hours AND time range
      });
      expectToolError(result, 'Invalid parameters');
    });
  });

  describe('update_time_entry tool', () => {
    it('should successfully update a time entry', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const updateTimeEntryTool = timeEntryTools.find((tool: any) => tool.name === 'update_time_entry');

      expect(updateTimeEntryTool).toBeDefined();

      const result = await updateTimeEntryTool.execute({
        id: 636709355,
        hours: 7.5,
        notes: 'Updated: Development work on authentication system'
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(636709355);
      expect(result.hours).toBe(7.5);
      expect(result.notes).toContain('Updated:');
    });

    it('should validate required id parameter', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const updateTimeEntryTool = timeEntryTools.find((tool: any) => tool.name === 'update_time_entry');

      const result = await updateTimeEntryTool.execute({
        hours: 5.0
        // Missing id
      });
      expectToolError(result, 'Invalid parameters');
    });
  });

  describe('delete_time_entry tool', () => {
    it('should successfully delete a time entry', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const deleteTimeEntryTool = timeEntryTools.find((tool: any) => tool.name === 'delete_time_entry');

      expect(deleteTimeEntryTool).toBeDefined();

      const result = await deleteTimeEntryTool.execute({ time_entry_id: 636709355 });
      
      expect(result).toBeDefined();
      expect(result.message).toContain('deleted successfully');
    });

    it('should handle not found errors for delete', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const deleteTimeEntryTool = timeEntryTools.find((tool: any) => tool.name === 'delete_time_entry');

      const result = await deleteTimeEntryTool.execute({ time_entry_id: 999999999 });
      expectToolError(result, 'HTTP 404');
    });
  });

  describe('timer tools', () => {
    it('should successfully start a timer', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const startTimerTool = timeEntryTools.find((tool: any) => tool.name === 'start_timer');

      expect(startTimerTool).toBeDefined();

      const result = await startTimerTool.execute({
        project_id: 14307913,
        task_id: 8083365,
        spent_date: '2025-09-10',
        notes: 'Timer started for new task'
      });
      
      expect(result).toBeDefined();
      expect(result.is_running).toBe(true);
      expect(result.hours).toBe(0); // Just started
      expect(result.timer_started_at).toBeTruthy();
    });

    it('should successfully stop a timer', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const stopTimerTool = timeEntryTools.find((tool: any) => tool.name === 'stop_timer');

      expect(stopTimerTool).toBeDefined();

      const result = await stopTimerTool.execute({ id: 636709357 });
      
      expect(result).toBeDefined();
      expect(result.is_running).toBe(false);
      expect(result.hours).toBeGreaterThan(0); // Should have calculated hours
      expect(result.ended_time).toBeValidTimeString();
    });

    it('should successfully restart a timer', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const restartTimerTool = timeEntryTools.find((tool: any) => tool.name === 'restart_timer');

      expect(restartTimerTool).toBeDefined();

      const result = await restartTimerTool.execute({ id: 636709355 });
      
      expect(result).toBeDefined();
      expect(result.is_running).toBe(true);
      expect(result.hours).toBe(0); // Fresh restart
      expect(result.timer_started_at).toBeTruthy();
      expect(result.id).not.toBe(636709355); // New entry created
    });

    it('should validate required parameters for timer operations', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      const startTimerTool = timeEntryTools.find((tool: any) => tool.name === 'start_timer');
      const stopTimerTool = timeEntryTools.find((tool: any) => tool.name === 'stop_timer');
      const restartTimerTool = timeEntryTools.find((tool: any) => tool.name === 'restart_timer');

      // Start timer validation
      const result1 = await startTimerTool.execute({});
      expectToolError(result1, 'Invalid parameters');
      
      // Test missing spent_date specifically
      const result1b = await startTimerTool.execute({
        project_id: 14307913,
        task_id: 8083365
        // Missing spent_date
      });
      expectToolError(result1b, 'Invalid parameters');

      // Stop timer validation  
      const result2 = await stopTimerTool.execute({});
      expectToolError(result2, 'Invalid parameters');

      // Restart timer validation
      const result3 = await restartTimerTool.execute({});
      expectToolError(result3, 'Invalid parameters');
    });
  });

  describe('MCP Integration', () => {
    it('should return all time entry tools by category', async () => {
      const timeEntryTools = harvestServer.getToolsByCategory('time_entries');
      
      expect(timeEntryTools).toHaveLength(8);
      
      const toolNames = timeEntryTools.map((tool: any) => tool.name);
      expect(toolNames).toContain('list_time_entries');
      expect(toolNames).toContain('get_time_entry');
      expect(toolNames).toContain('create_time_entry');
      expect(toolNames).toContain('update_time_entry');
      expect(toolNames).toContain('delete_time_entry');
      expect(toolNames).toContain('start_timer');
      expect(toolNames).toContain('stop_timer');
      expect(toolNames).toContain('restart_timer');
    });

    it('should have proper tool descriptions and schemas', async () => {
      const tools = await harvestServer.listTools();
      const timeEntryTools = tools.filter((tool: any) => 
        tool.name.includes('time_entry') || tool.name.includes('time_entries') || tool.name.includes('timer')
      );
      
      expect(timeEntryTools).toHaveLength(8);
      
      timeEntryTools.forEach((tool: any) => {
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
      });
    });
  });
});