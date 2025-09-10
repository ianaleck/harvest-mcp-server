/**
 * Harvest API Mock Server
 * Comprehensive mock based on the Harvest API Postman collection
 * Provides realistic responses for all endpoints without external API calls
 */

import { z } from 'zod';

export interface MockResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
}

export class HarvestMockServer {
  private responses: Map<string, MockResponse> = new Map();

  constructor() {
    this.setupMockResponses();
  }

  private setupMockResponses() {
    // Company endpoint
    this.responses.set('GET:/v2/company', {
      status: 200,
      data: {
        id: 1234567,
        name: "Mock Harvest Company",
        is_active: true,
        week_start_day: "monday",
        wants_timestamp_timers: false,
        time_format: "decimal",
        plan_type: "standard",
        clock: "24h",
        decimal_symbol: ".",
        thousands_separator: ",",
        color_scheme: "blue",
        weekly_capacity: 40,
        expense_feature: true,
        invoice_feature: true,
        estimate_feature: true,
        approval_feature: false,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z"
      }
    });

    // Time Entries endpoints
    this.responses.set('GET:/v2/time_entries', {
      status: 200,
      data: {
        time_entries: [
          {
            id: 636709355,
            spent_date: "2025-09-10",
            hours: 8.25, // 8 hours 15 minutes in decimal
            hours_without_timer: 8.25,
            rounded_hours: 8.25,
            notes: "Development work on authentication system",
            is_locked: false,
            locked_reason: null,
            is_closed: false,
            is_billed: false,
            timer_started_at: null,
            started_time: "09:00",
            ended_time: "17:15",
            is_running: false,
            billable: true,
            budgeted: true,
            billable_rate: 100.0,
            cost_rate: 75.0,
            created_at: "2025-09-10T09:00:00Z",
            updated_at: "2025-09-10T17:15:00Z",
            user: {
              id: 1782959,
              name: "John Developer",
              email: "john@example.com"
            },
            project: {
              id: 14307913,
              name: "Web Application Project",
              code: "WAP"
            },
            task: {
              id: 8083365,
              name: "Development"
            },
            client: {
              id: 5735776,
              name: "Acme Corporation",
              currency: "USD"
            },
            invoice: null,
            external_reference: null
          }
        ],
        per_page: 2000,
        total_pages: 1,
        total_entries: 1,
        next_page: null,
        previous_page: null,
        page: 1,
        links: {
          first: "https://api.harvestapp.com/v2/time_entries?page=1",
          next: null,
          previous: null,
          last: "https://api.harvestapp.com/v2/time_entries?page=1"
        }
      }
    });

    // Single time entry
    this.responses.set('GET:/v2/time_entries/636709355', {
      status: 200,
      data: {
        id: 636709355,
        spent_date: "2025-09-10",
        hours: 8.25,
        hours_without_timer: 8.25,
        rounded_hours: 8.25,
        notes: "Development work on authentication system",
        is_locked: false,
        locked_reason: null,
        is_closed: false,
        is_billed: false,
        timer_started_at: null,
        started_time: "09:00",
        ended_time: "17:15",
        is_running: false,
        billable: true,
        budgeted: true,
        billable_rate: 100.0,
        cost_rate: 75.0,
        created_at: "2025-09-10T09:00:00Z",
        updated_at: "2025-09-10T17:15:00Z",
        user: {
          id: 1782959,
          name: "John Developer",
          email: "john@example.com"
        },
        project: {
          id: 14307913,
          name: "Web Application Project",
          code: "WAP"
        },
        task: {
          id: 8083365,
          name: "Development"
        },
        client: {
          id: 5735776,
          name: "Acme Corporation",
          currency: "USD"
        },
        invoice: null,
        external_reference: null
      }
    });

    // POST Time Entry
    this.responses.set('POST:/v2/time_entries', {
      status: 201,
      data: {
        id: 636709356,
        spent_date: "2025-09-10",
        hours: 2.5,
        hours_without_timer: 2.5,
        rounded_hours: 2.5,
        notes: "Code review and testing",
        is_locked: false,
        locked_reason: null,
        is_closed: false,
        is_billed: false,
        timer_started_at: null,
        started_time: null,
        ended_time: null,
        is_running: false,
        billable: true,
        budgeted: true,
        billable_rate: 100.0,
        cost_rate: 75.0,
        created_at: "2025-09-10T14:00:00Z",
        updated_at: "2025-09-10T14:00:00Z",
        user: {
          id: 1782959,
          name: "John Developer",
          email: "john@example.com"
        },
        project: {
          id: 14307913,
          name: "Web Application Project",
          code: "WAP"
        },
        task: {
          id: 8083365,
          name: "Development"
        },
        client: {
          id: 5735776,
          name: "Acme Corporation",
          currency: "USD"
        },
        invoice: null,
        external_reference: null
      }
    });

    // Projects endpoint
    this.responses.set('GET:/v2/projects', {
      status: 200,
      data: {
        projects: [
          {
            id: 14307913,
            name: "Web Application Project",
            code: "WAP",
            is_active: true,
            is_billable: true,
            is_fixed_fee: false,
            bill_by: "Project",
            hourly_rate: 100.0,
            budget: 50000.0,
            budget_by: "project",
            budget_is_monthly: false,
            notify_when_over_budget: true,
            over_budget_notification_percentage: 80.0,
            over_budget_notification_date: null,
            show_budget_to_all: false,
            cost_budget: 35000.0,
            cost_budget_include_expenses: false,
            fee: null,
            notes: "Main web application development project",
            starts_on: "2025-01-01",
            ends_on: "2025-12-31",
            created_at: "2024-12-01T00:00:00Z",
            updated_at: "2025-09-10T00:00:00Z",
            client: {
              id: 5735776,
              name: "Acme Corporation",
              currency: "USD"
            }
          }
        ],
        per_page: 2000,
        total_pages: 1,
        total_entries: 1,
        next_page: null,
        previous_page: null,
        page: 1,
        links: {
          first: "https://api.harvestapp.com/v2/projects?page=1",
          next: null,
          previous: null,
          last: "https://api.harvestapp.com/v2/projects?page=1"
        }
      }
    });

    // Clients endpoint
    this.responses.set('GET:/v2/clients', {
      status: 200,
      data: {
        clients: [
          {
            id: 5735776,
            name: "Acme Corporation",
            is_active: true,
            address: "123 Business Ave\nSuite 100\nBusiness City, BC 12345",
            statement_key: "acme-corp",
            currency: "USD",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-06-01T00:00:00Z"
          }
        ],
        per_page: 2000,
        total_pages: 1,
        total_entries: 1,
        next_page: null,
        previous_page: null,
        page: 1,
        links: {
          first: "https://api.harvestapp.com/v2/clients?page=1",
          next: null,
          previous: null,
          last: "https://api.harvestapp.com/v2/clients?page=1"
        }
      }
    });

    // Users endpoint
    this.responses.set('GET:/v2/users/me', {
      status: 200,
      data: {
        id: 1782959,
        first_name: "John",
        last_name: "Developer",
        email: "john@example.com",
        telephone: "",
        timezone: "America/New_York",
        has_access_to_all_future_projects: false,
        is_contractor: false,
        is_admin: true,
        is_project_manager: true,
        can_see_rates: true,
        can_create_projects: true,
        can_create_invoices: true,
        is_active: true,
        weekly_capacity: 144000, // 40 hours in seconds
        default_hourly_rate: 100.0,
        cost_rate: 75.0,
        roles: ["Administrator", "Project Manager"],
        access_roles: ["administrator", "project_manager"],
        avatar_url: "https://secure.gravatar.com/avatar/example?s=140&d=blank",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z"
      }
    });

    // Error responses
    this.responses.set('ERROR:401', {
      status: 401,
      data: {
        error: "invalid_token",
        error_description: "The access token provided is invalid"
      }
    });

    this.responses.set('ERROR:429', {
      status: 429,
      data: {
        error: "rate_limit_exceeded",
        error_description: "Too many requests"
      },
      headers: {
        'Retry-After': '60'
      }
    });

    this.responses.set('ERROR:404', {
      status: 404,
      data: {
        error: "not_found",
        error_description: "The requested resource was not found"
      }
    });
  }

  /**
   * Mock HTTP request - simulates axios calls
   */
  async request(config: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    data?: any;
  }): Promise<{ status: number; data: any; headers?: Record<string, string> }> {
    const { method, url, headers } = config;
    
    // Simulate authentication check
    if (!headers?.['Authorization'] || !headers?.['Harvest-Account-Id']) {
      return this.responses.get('ERROR:401')!;
    }

    if (headers['Authorization'] === 'Bearer invalid-token') {
      return this.responses.get('ERROR:401')!;
    }

    // Extract path from full URL
    const urlPath = url.replace('https://api.harvestapp.com', '');
    const key = `${method.toUpperCase()}:${urlPath}`;
    
    const response = this.responses.get(key);
    
    if (!response) {
      return this.responses.get('ERROR:404')!;
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return response;
  }

  /**
   * Add custom response for testing
   */
  addResponse(method: string, path: string, response: MockResponse) {
    this.responses.set(`${method.toUpperCase()}:${path}`, response);
  }

  /**
   * Simulate rate limiting
   */
  simulateRateLimit() {
    // Override next request to return 429
    const originalRequest = this.request.bind(this);
    this.request = async (config) => {
      this.request = originalRequest; // Reset after one call
      return this.responses.get('ERROR:429')!;
    };
  }

  /**
   * Reset to default responses
   */
  reset() {
    this.setupMockResponses();
  }
}