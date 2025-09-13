import { BaseHarvestClient, HarvestAPIOptions } from './base-client';

export class ProjectsClient extends BaseHarvestClient {
  constructor(options: HarvestAPIOptions) {
    super(options, 'projects-client');
  }

  async getProjects(query?: any): Promise<any> {
    try {
      // Build query string
      const queryString = this.buildQueryString(query);
      const url = queryString ? `/projects?${queryString}` : '/projects';
      
      this.logger.debug('Fetching projects', { query });
      const response = await this.client.get(url);
      
      this.logger.info('Successfully retrieved projects', {
        count: response.data.projects?.length ?? 0,
        page: response.data.page,
        totalPages: response.data.total_pages
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list projects:', { error: (error as Error).message });
      throw error;
    }
  }

  async getProject(projectId: number): Promise<any> {
    try {
      this.logger.debug('Fetching project', { projectId });
      const response = await this.client.get(`/projects/${projectId}`);
      
      this.logger.info('Successfully retrieved project', {
        projectId: response.data.id,
        projectName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch project:', error);
      throw error;
    }
  }

  async createProject(input: any): Promise<any> {
    try {
      this.logger.debug('Creating project', {
        name: input.name,
        clientId: input.client_id
      });
      
      const response = await this.client.post('/projects', input);
      
      this.logger.info('Successfully created project', {
        projectId: response.data.id,
        projectName: response.data.name,
        clientId: response.data.client.id
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create project:', error);
      throw error;
    }
  }

  async updateProject(input: any): Promise<any> {
    try {
      const { id, ...updateData } = input;
      
      this.logger.debug('Updating project', {
        projectId: id,
        updateFields: Object.keys(updateData)
      });
      
      const response = await this.client.patch(`/projects/${id}`, updateData);
      
      this.logger.info('Successfully updated project', {
        projectId: response.data.id,
        projectName: response.data.name
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update project:', error);
      throw error;
    }
  }

  async deleteProject(projectId: number): Promise<void> {
    try {
      this.logger.debug('Deleting project', { projectId });
      
      await this.client.delete(`/projects/${projectId}`);
      
      this.logger.info('Successfully deleted project', { projectId });
    } catch (error) {
      this.logger.error('Failed to delete project:', error);
      throw error;
    }
  }

  async getProjectTaskAssignments(projectId: number, query?: any): Promise<any> {
    try {
      // Build query string
      const queryString = this.buildQueryString(query);
      const url = queryString ? `/projects/${projectId}/task_assignments?${queryString}` : `/projects/${projectId}/task_assignments`;
      
      this.logger.debug('Fetching project task assignments', { projectId, query });
      const response = await this.client.get(url);
      
      this.logger.info('Successfully retrieved project task assignments', {
        projectId,
        count: response.data.task_assignments?.length || 0
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to list project task assignments:', error);
      throw error;
    }
  }

  async createProjectTaskAssignment(projectId: number, input: any): Promise<any> {
    try {
      this.logger.debug('Creating project task assignment', { projectId, taskId: input.task_id });
      
      const response = await this.client.post(`/projects/${projectId}/task_assignments`, input);
      
      this.logger.info('Successfully created project task assignment', {
        projectId,
        taskAssignmentId: response.data.id,
        taskId: response.data.task.id
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create project task assignment:', error);
      throw error;
    }
  }

  async updateProjectTaskAssignment(projectId: number, input: any): Promise<any> {
    try {
      const { id, ...updateData } = input;
      
      this.logger.debug('Updating project task assignment', { projectId, taskAssignmentId: id });
      
      const response = await this.client.patch(`/projects/${projectId}/task_assignments/${id}`, updateData);
      
      this.logger.info('Successfully updated project task assignment', {
        projectId,
        taskAssignmentId: response.data.id
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update project task assignment:', error);
      throw error;
    }
  }

  async deleteProjectTaskAssignment(projectId: number, taskAssignmentId: number): Promise<void> {
    try {
      this.logger.debug('Deleting project task assignment', { projectId, taskAssignmentId });
      
      await this.client.delete(`/projects/${projectId}/task_assignments/${taskAssignmentId}`);
      
      this.logger.info('Successfully deleted project task assignment', { projectId, taskAssignmentId });
    } catch (error) {
      this.logger.error('Failed to delete project task assignment:', error);
      throw error;
    }
  }
}