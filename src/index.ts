#!/usr/bin/env node

import { HarvestMCPServer } from './server';
import { createLogger } from './utils/logger';

const logger = createLogger('main');

async function main() {
  try {
    const server = new HarvestMCPServer();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await server.close();
      process.exit(0);
    });

    // Determine transport (default stdio)
    const transport = (process.env.MCP_TRANSPORT || 'stdio').toLowerCase();
    if (transport === 'http' || transport === 'streamable-http') {
      logger.info('Starting Harvest MCP Server with HTTP transport');
      await server.runHttp({});
    } else {
      logger.info('Starting Harvest MCP Server with stdio transport');
      await server.run();
    }
    
  } catch (error) {
    logger.error('Failed to start Harvest MCP Server:', error);
    process.exit(1);
  }
}

// Only run if this is the main module (CommonJS version)
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error in main:', error);
    process.exit(1);
  });
}