import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { appConfig, HarvestConfig } from './config/index';
import { createLogger } from './utils/logger';
import { HarvestAPIClient } from './client/harvest-api';
import { BaseToolConfig } from './types';
import { registerCompanyTools } from './tools/company';
import { registerTimeEntryTools } from './tools/time-entries';
import { registerProjectTools } from './tools/projects';
import { registerTaskTools } from './tools/tasks';
import { registerClientTools } from './tools/clients';
import { registerUserTools } from './tools/users';
import { registerInvoiceTools } from './tools/invoices';
import { registerExpenseTools } from './tools/expenses';
import { registerEstimateTools } from './tools/estimates';
import { registerReportTools } from './tools/reports';

const logger = createLogger('harvest-mcp-server');

export interface HarvestMCPServerOptions {
  harvest?: {
    accessToken: string;
    accountId: string;
  };
}

export class HarvestMCPServer {
  private server: Server;
  public harvestClient: HarvestAPIClient; // Make public for testing
  private tools: Map<string, Tool> = new Map();
  private toolHandlers: Map<string, any> = new Map();

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
    this.registerAllTools();
  }

  private registerAllTools() {
    // Create a config that always references the current client
    const self = this;
    const config: BaseToolConfig = {
      get harvestClient() {
        return self.harvestClient;
      },
      logger: logger,
    };

    // Register all modular tools
    const toolModules = [
      registerCompanyTools(config),
      registerTimeEntryTools(config),
      registerProjectTools(config),
      registerTaskTools(config),
      registerClientTools(config),
      registerUserTools(config),
      registerInvoiceTools(config),
      registerExpenseTools(config),
      registerEstimateTools(config),
      registerReportTools(config),
    ];

    // Flatten and register all tools
    toolModules.forEach(toolRegistrations => {
      toolRegistrations.forEach(({ tool, handler }) => {
        this.tools.set(tool.name, tool);
        this.toolHandlers.set(tool.name, handler);
      });
    });
  }

  private registerToolHandlers() {
    // Register list_tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()),
      };
    });

    // Register call_tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;
      
      const handler = this.toolHandlers.get(name);
      if (!handler) {
        throw new Error(`Unknown tool: ${name}`);
      }

      try {
        return await handler.execute(args || {});
      } catch (error) {
        logger.error(`Tool execution failed for ${name}:`, error);
        throw error;
      }
    });
  }

  public async listTools(): Promise<Tool[]> {
    return Array.from(this.tools.values());
  }

  public getToolsByCategory(category: string): any[] {
    const tools: any[] = [];
    
    // Map category names to tool name prefixes/patterns
    const categoryMappings: Record<string, string[]> = {
      'company': ['get_company'],
      'time_entries': ['list_time_entries', 'get_time_entry', 'create_time_entry', 'update_time_entry', 'delete_time_entry', 'start_timer', 'stop_timer', 'restart_timer'],
      'projects': ['list_projects', 'get_project', 'create_project', 'update_project', 'delete_project', 'list_project_task_assignments', 'create_project_task_assignment', 'update_project_task_assignment', 'delete_project_task_assignment'],
      'tasks': ['list_tasks', 'get_task', 'create_task', 'update_task', 'delete_task'],
      'clients': ['list_clients', 'get_client', 'create_client', 'update_client', 'delete_client'],
      'users': ['list_users', 'get_user', 'get_current_user', 'create_user', 'update_user', 'delete_user'],
      'invoices': ['list_invoices', 'get_invoice', 'create_invoice', 'update_invoice', 'delete_invoice'],
      'expenses': ['list_expenses', 'get_expense', 'create_expense', 'update_expense', 'delete_expense', 'list_expense_categories'],
      'estimates': ['list_estimates', 'get_estimate', 'create_estimate', 'update_estimate', 'delete_estimate'],
      'reports': ['get_time_report', 'get_expense_report', 'get_project_budget_report', 'get_uninvoiced_report'],
    };

    const toolNames = categoryMappings[category] || [];
    
    for (const toolName of toolNames) {
      const tool = this.tools.get(toolName);
      const handler = this.toolHandlers.get(toolName);
      
      if (tool && handler) {
        // Create a combined object with tool metadata and a test-friendly execute method
        tools.push({
          ...tool,
          execute: async (args: Record<string, any>) => {
            const mcpResult = await handler.execute(args);
            // For contract tests, extract the business data from the MCP response
            if (mcpResult.content && mcpResult.content[0] && mcpResult.content[0].text) {
              try {
                return JSON.parse(mcpResult.content[0].text);
              } catch {
                // If parsing fails, return the MCP format
                return mcpResult;
              }
            }
            return mcpResult;
          }
        });
      }
    }
    
    return tools;
  }

  public async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Harvest MCP Server running on stdio transport');
  }

  public async close() {
    if (this.harvestClient) {
      await this.harvestClient.close?.();
    }
  }
}