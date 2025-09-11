/**
 * TypeScript type definitions for Harvest MCP Server
 * Centralized type exports and common interfaces
 */

import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';

// Re-export all schema types
export * from '../schemas/company';
export * from '../schemas/time-entry';
export * from '../schemas/project';
export * from '../schemas/task';
export * from '../schemas/client';
export * from '../schemas/user';
export * from '../schemas/invoice';
export * from '../schemas/expense';
export * from '../schemas/estimate';
export * from '../schemas/report';

// MCP Tool Handler interface
export interface ToolHandler {
  execute(args: Record<string, any>): Promise<CallToolResult>;
}

// Tool Registration interface
export interface ToolRegistration {
  tool: Tool;
  handler: ToolHandler;
}

// Tool Category type
export type ToolCategory = 
  | 'company'
  | 'time_entries' 
  | 'projects'
  | 'tasks'
  | 'clients'
  | 'users'
  | 'invoices'
  | 'expenses'
  | 'estimates'
  | 'reports';

// Base tool configuration
export interface BaseToolConfig {
  harvestClient: any; // HarvestAPIClient
  logger: any; // Logger instance
}

// Error types
export interface HarvestError extends Error {
  code?: string;
  status?: number;
  response?: any;
}

// Pagination info
export interface PaginationInfo {
  page: number;
  per_page: number;
  total_pages: number;
  total_entries: number;
  next_page: number | null;
  previous_page: number | null;
}

// Common response wrapper
export interface HarvestListResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  links: {
    first: string;
    next: string | null;
    previous: string | null;
    last: string;
  };
}