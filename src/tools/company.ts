/**
 * Company Tools for Harvest MCP Server
 * Handles company information retrieval and management
 */

import { CallToolResult } from '@modelcontextprotocol/sdk/types';
import { createLogger } from '../utils/logger';
import { handleMCPToolError } from '../utils/errors';
import { BaseToolConfig, ToolHandler, ToolRegistration } from '../types';

const logger = createLogger('company-tools');

class CompanyToolHandler implements ToolHandler {
  constructor(private config: BaseToolConfig) {}

  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      logger.info('Fetching company information from Harvest API');
      const company = await this.config.harvestClient.getCompany();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(company, null, 2),
          },
        ],
      };
    } catch (error) {
      handleMCPToolError(error, 'get_company');
    }
  }
}

export function registerCompanyTools(config: BaseToolConfig): ToolRegistration[] {
  const handler = new CompanyToolHandler(config);

  return [
    {
      tool: {
        name: 'get_company',
        description: 'Retrieve company information and settings for the authenticated account. Returns comprehensive company details including billing configuration, time tracking preferences, and enabled features.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      handler,
    },
  ];
}