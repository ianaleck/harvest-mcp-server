/**
 * Project Tools Contract Tests
 */

import '../matchers/harvest-matchers';
import { HarvestMockServer } from '../mocks/harvest-mock-server';

describe('Project Tools', () => {
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

  describe('list_projects tool', () => {
    it('should successfully list projects', async () => {
      const projectTools = harvestServer.getToolsByCategory('projects');
      expect(projectTools.length).toBe(9); // Should be 9 project tools (6 projects + 3 task assignments)
      
      const listProjectsTool = projectTools.find((tool: any) => tool.name === 'list_projects');
      expect(listProjectsTool).toBeDefined();

      const result = await listProjectsTool.execute({});
      
      expect(result).toBeDefined();
      expect(result.projects).toBeDefined();
      expect(Array.isArray(result.projects)).toBe(true);
    });

    it('should validate query parameters', async () => {
      const projectTools = harvestServer.getToolsByCategory('projects');
      const listProjectsTool = projectTools.find((tool: any) => tool.name === 'list_projects');

      await expect(listProjectsTool.execute({
        is_active: 'invalid', // Should be boolean
      })).rejects.toThrow('Invalid parameters');
    });
  });

  describe('get_project tool', () => {
    it('should successfully retrieve a specific project', async () => {
      const projectTools = harvestServer.getToolsByCategory('projects');
      const getProjectTool = projectTools.find((tool: any) => tool.name === 'get_project');

      const result = await getProjectTool.execute({ project_id: 14307913 });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(14307913);
      expect(result.name).toBeTruthy();
      expect(typeof result.is_active).toBe('boolean');
    });

    it('should validate required parameters', async () => {
      const projectTools = harvestServer.getToolsByCategory('projects');
      const getProjectTool = projectTools.find((tool: any) => tool.name === 'get_project');

      await expect(getProjectTool.execute({}))
        .rejects.toThrow('Invalid parameters');
    });
  });

  describe('create_project tool', () => {
    it('should successfully create a project', async () => {
      const projectTools = harvestServer.getToolsByCategory('projects');
      const createProjectTool = projectTools.find((tool: any) => tool.name === 'create_project');

      const result = await createProjectTool.execute({
        name: 'Test Project',
        client_id: 5735776,
        is_active: true
      });
      
      expect(result).toBeDefined();
      expect(result.id).toHaveValidHarvestId();
      expect(result.name).toBe('New Project');
      expect(result.client.id).toBe(5735776);
    });

    it('should validate required parameters', async () => {
      const projectTools = harvestServer.getToolsByCategory('projects');
      const createProjectTool = projectTools.find((tool: any) => tool.name === 'create_project');

      await expect(createProjectTool.execute({}))
        .rejects.toThrow('Invalid parameters');
    });
  });

  describe('update_project tool', () => {
    it('should successfully update a project', async () => {
      const projectTools = harvestServer.getToolsByCategory('projects');
      const updateProjectTool = projectTools.find((tool: any) => tool.name === 'update_project');

      const result = await updateProjectTool.execute({
        id: 14307913,
        name: 'Updated Project Name',
        is_active: false
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(14307913);
      expect(result.name).toBe('Updated Web Application Project');
    });
  });

  describe('delete_project tool', () => {
    it('should successfully delete a project', async () => {
      const projectTools = harvestServer.getToolsByCategory('projects');
      const deleteProjectTool = projectTools.find((tool: any) => tool.name === 'delete_project');

      const result = await deleteProjectTool.execute({ project_id: 14307913 });
      
      expect(result).toBeDefined();
      expect(result.message).toContain('deleted successfully');
    });
  });

  describe('project task assignment tools', () => {
    it('should list project task assignments', async () => {
      const projectTools = harvestServer.getToolsByCategory('projects');
      const listAssignmentsTool = projectTools.find((tool: any) => tool.name === 'list_project_task_assignments');

      const result = await listAssignmentsTool.execute({ project_id: 14307913 });
      
      expect(result).toBeDefined();
      expect(result.task_assignments).toBeDefined();
      expect(Array.isArray(result.task_assignments)).toBe(true);
    });

    it('should create project task assignment', async () => {
      const projectTools = harvestServer.getToolsByCategory('projects');
      const createAssignmentTool = projectTools.find((tool: any) => tool.name === 'create_project_task_assignment');

      const result = await createAssignmentTool.execute({
        project_id: 14307913,
        task_id: 8083367,
        is_active: true
      });
      
      expect(result).toBeDefined();
      expect(result.id).toHaveValidHarvestId();
      expect(result.task.id).toBe(8083367);
    });

    it('should update project task assignment', async () => {
      const projectTools = harvestServer.getToolsByCategory('projects');
      const updateAssignmentTool = projectTools.find((tool: any) => tool.name === 'update_project_task_assignment');

      const result = await updateAssignmentTool.execute({
        project_id: 14307913,
        id: 155505014,
        is_active: false
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(155505014);
      expect(result.is_active).toBe(true);
    });

    it('should delete project task assignment', async () => {
      const projectTools = harvestServer.getToolsByCategory('projects');
      const deleteAssignmentTool = projectTools.find((tool: any) => tool.name === 'delete_project_task_assignment');

      const result = await deleteAssignmentTool.execute({
        project_id: 14307913,
        task_assignment_id: 155505014
      });
      
      expect(result).toBeDefined();
      expect(result.message).toContain('deleted');
    });
  });

  describe('MCP Integration', () => {
    it('should return all project tools by category', async () => {
      const projectTools = harvestServer.getToolsByCategory('projects');
      
      expect(projectTools).toHaveLength(9);
      
      const toolNames = projectTools.map((tool: any) => tool.name);
      expect(toolNames).toContain('list_projects');
      expect(toolNames).toContain('get_project');
      expect(toolNames).toContain('create_project');
      expect(toolNames).toContain('update_project');
      expect(toolNames).toContain('delete_project');
      expect(toolNames).toContain('list_project_task_assignments');
      expect(toolNames).toContain('create_project_task_assignment');
      expect(toolNames).toContain('update_project_task_assignment');
      expect(toolNames).toContain('delete_project_task_assignment');
    });
  });
});