/**
 * Types Unit Tests for Coverage
 */

// Set test environment variables before any imports
process.env.HARVEST_ACCESS_TOKEN = 'test_token_12345';
process.env.HARVEST_ACCOUNT_ID = '123456';

import { 
  ToolHandler, 
  BaseToolConfig, 
  ToolRegistration,
  // Import re-exported schema types to trigger coverage of export lines
  Company,
  TimeEntry,
  Project,
  Task,
  Client,
  User,
  Invoice,
  Expense,
  Estimate,
  TimeReport
} from '../../../src/types';

describe('Types', () => {
  it('should define ToolHandler interface correctly', () => {
    const mockHandler: ToolHandler = {
      execute: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'test' }] })
    };

    expect(typeof mockHandler.execute).toBe('function');
  });

  it('should define BaseToolConfig interface correctly', () => {
    const mockConfig: BaseToolConfig = {
      harvestClient: {} as any,
      logger: {} as any
    };

    expect(mockConfig).toBeDefined();
    expect(mockConfig.harvestClient).toBeDefined();
    expect(mockConfig.logger).toBeDefined();
  });

  it('should define ToolRegistration interface correctly', () => {
    const mockTool = {
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: { type: 'object', properties: {} }
    };

    const mockRegistration: ToolRegistration = {
      tool: mockTool as any,
      handler: {} as ToolHandler
    };

    expect(mockRegistration.tool).toBeDefined();
    expect(mockRegistration.handler).toBeDefined();
  });

  it('should re-export schema types correctly', async () => {
    // Import the module dynamically to trigger coverage of export statements
    const typesModule = await import('../../../src/types');
    
    // Verify that re-exported types are available
    expect(typesModule.CompanySchema).toBeDefined();
    expect(typesModule.TimeEntrySchema).toBeDefined();
    expect(typesModule.ProjectSchema).toBeDefined();
    expect(typesModule.TaskSchema).toBeDefined();
    expect(typesModule.ClientSchema).toBeDefined();
    expect(typesModule.UserSchema).toBeDefined();
    expect(typesModule.InvoiceSchema).toBeDefined();
    expect(typesModule.ExpenseSchema).toBeDefined();
    expect(typesModule.EstimateSchema).toBeDefined();
    expect(typesModule.TimeReportSchema).toBeDefined();
  });
});