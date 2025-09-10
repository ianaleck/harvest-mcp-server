import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolResult,
  Tool,
} from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { appConfig, HarvestConfig } from './config/index';
import { createLogger } from './utils/logger';
import { HarvestAPIClient } from './client/harvest-api';

const logger = createLogger('server');

export interface HarvestMCPServerOptions {
  harvest: {
    accessToken: string;
    accountId: string;
  };
}

export class HarvestMCPServer {
  private server: Server;
  public harvestClient: HarvestAPIClient; // Make public for testing
  private tools: Map<string, Tool> = new Map();

  constructor(options?: HarvestMCPServerOptions) {
    // Use provided options or fall back to config
    const harvestConfig = options?.harvest || {
      accessToken: appConfig.harvest.accessToken,
      accountId: appConfig.harvest.accountId,
    };

    this.server = new Server(
      {
        name: 'harvest-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.harvestClient = new HarvestAPIClient(harvestConfig);
    this.registerToolHandlers();
    this.registerCompanyTools();
  }

  private registerToolHandlers() {
    // Register list_tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()),
      };
    });

    // Register call_tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = this.tools.get(name);
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      try {
        return await this.executeTool(name, args || {});
      } catch (error) {
        logger.error(`Tool execution failed for ${name}:`, error);
        throw error;
      }
    });
  }

  private async executeTool(name: string, args: Record<string, any>): Promise<CallToolResult> {
    switch (name) {
      case 'get_company':
        return await this.getCompany(args);
      default:
        throw new Error(`Tool not implemented: ${name}`);
    }
  }

  private registerCompanyTools() {
    // Register get_company tool
    this.tools.set('get_company', {
      name: 'get_company',
      description: 'Retrieve company information and settings for the authenticated account. Returns comprehensive company details including billing configuration, time tracking preferences, and enabled features.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    });
  }

  private async getCompany(_args: Record<string, any>): Promise<CallToolResult> {
    try {
      logger.info('Fetching company information from Harvest API');
      const company = await this.harvestClient.getCompany();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(company, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Failed to fetch company information:', error);
      throw new Error(`Failed to retrieve company information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public getToolsByCategory(category: string): any[] {
    // Helper method for testing
    const categoryTools = Array.from(this.tools.values()).filter(tool => {
      if (category === 'company') {
        return tool.name.includes('company') || tool.name === 'get_company';
      }
      return false;
    });
    
    return categoryTools.map(tool => ({
      ...tool,
      execute: async (args: Record<string, any>) => {
        const result = await this.executeTool(tool.name, args);
        return {
          content: JSON.parse(result.content[0].text as string),
        };
      },
      httpClient: this.harvestClient, // For testing
    }));
  }

  public async listTools(): Promise<Tool[]> {
    return Array.from(this.tools.values());
  }

  public async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Harvest MCP Server running on stdio transport');
  }

  public async close() {
    // Cleanup resources
    if (this.harvestClient) {
      await this.harvestClient.close?.();
    }
  }
}