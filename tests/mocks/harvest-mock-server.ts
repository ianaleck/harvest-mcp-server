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
  public responses: Map<string, MockResponse> = new Map();

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

    // Time Entries endpoints - List with pagination
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

    // POST Time Entry (handles both regular creation and timer start)
    this.responses.set('POST:/v2/time_entries', {
      status: 201,
      data: {
        id: 636709356,
        spent_date: "2025-09-10",
        hours: 2.5, // Hours calculated from 09:00 to 11:30
        hours_without_timer: 2.5,
        rounded_hours: 2.5,
        notes: "Morning development work",
        is_locked: false,
        locked_reason: null,
        is_closed: false,
        is_billed: false,
        timer_started_at: null, // Not a timer entry
        started_time: "09:00",
        ended_time: "11:30",
        is_running: false, // Regular time entry, not running
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

    // PATCH Time Entry (Update)
    this.responses.set('PATCH:/v2/time_entries/636709355', {
      status: 200,
      data: {
        id: 636709355,
        spent_date: "2025-09-10",
        hours: 7.5, // Updated hours
        hours_without_timer: 7.5,
        rounded_hours: 7.5,
        notes: "Updated: Development work on authentication system",
        is_locked: false,
        locked_reason: null,
        is_closed: false,
        is_billed: false,
        timer_started_at: null,
        started_time: "09:00",
        ended_time: "16:30", // Updated end time
        is_running: false,
        billable: true,
        budgeted: true,
        billable_rate: 100.0,
        cost_rate: 75.0,
        created_at: "2025-09-10T09:00:00Z",
        updated_at: "2025-09-10T16:30:00Z", // Updated timestamp
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

    // DELETE Time Entry
    this.responses.set('DELETE:/v2/time_entries/636709355', {
      status: 200,
      data: {} // Harvest returns empty object on successful delete
    });

    // Stop Timer
    this.responses.set('PATCH:/v2/time_entries/636709357/stop', {
      status: 200,
      data: {
        id: 636709357,
        spent_date: "2025-09-10",
        hours: 2.5, // Calculated hours after stopping
        hours_without_timer: 2.5,
        rounded_hours: 2.5,
        notes: "Timer started for new task",
        is_locked: false,
        locked_reason: null,
        is_closed: false,
        is_billed: false,
        timer_started_at: null, // Cleared when stopped
        started_time: "14:30",
        ended_time: "17:00", // Set when timer stopped
        is_running: false, // Now stopped
        billable: true,
        budgeted: true,
        billable_rate: 100.0,
        cost_rate: 75.0,
        created_at: "2025-09-10T14:30:00Z",
        updated_at: "2025-09-10T17:00:00Z", // Updated when stopped
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

    // Restart Timer
    this.responses.set('PATCH:/v2/time_entries/636709355/restart', {
      status: 200,
      data: {
        id: 636709358, // New entry created from restart
        spent_date: "2025-09-10",
        hours: 0, // Fresh timer, no hours yet
        hours_without_timer: 0,
        rounded_hours: 0,
        notes: "Development work on authentication system", // Copied from original
        is_locked: false,
        locked_reason: null,
        is_closed: false,
        is_billed: false,
        timer_started_at: "2025-09-10T15:45:00Z", // Restarted time
        started_time: "15:45",
        ended_time: null, // Running again
        is_running: true, // Restarted and running
        billable: true,
        budgeted: true,
        billable_rate: 100.0,
        cost_rate: 75.0,
        created_at: "2025-09-10T15:45:00Z",
        updated_at: "2025-09-10T15:45:00Z",
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

    // Error responses for testing
    this.responses.set('GET:/v2/time_entries/999999999', {
      status: 404,
      data: {
        error: "not_found",
        error_description: "The time entry you requested does not exist."
      }
    });

    this.responses.set('DELETE:/v2/time_entries/999999999', {
      status: 404,
      data: {
        error: "not_found", 
        error_description: "The time entry you requested does not exist."
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

    // Individual project endpoint
    this.responses.set('GET:/v2/projects/14307913', {
      status: 200,
      data: {
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
    });

    // Create project endpoint
    this.responses.set('POST:/v2/projects', {
      status: 201,
      data: {
        id: 14307914,
        name: "New Project",
        code: "NP",
        is_active: true,
        is_billable: true,
        is_fixed_fee: false,
        bill_by: "none",
        hourly_rate: null,
        budget: null,
        budget_by: null,
        budget_is_monthly: false,
        notify_when_over_budget: false,
        over_budget_notification_percentage: null,
        over_budget_notification_date: null,
        show_budget_to_all: false,
        cost_budget: null,
        cost_budget_include_expenses: false,
        fee: null,
        notes: null,
        starts_on: null,
        ends_on: null,
        created_at: "2025-09-10T00:00:00Z",
        updated_at: "2025-09-10T00:00:00Z",
        client: {
          id: 5735776,
          name: "Acme Corporation",
          currency: "USD"
        }
      }
    });

    // Update project endpoint
    this.responses.set('PATCH:/v2/projects/14307913', {
      status: 200,
      data: {
        id: 14307913,
        name: "Updated Web Application Project",
        code: "UWAP",
        is_active: true,
        is_billable: true,
        is_fixed_fee: false,
        bill_by: "Project",
        hourly_rate: 120.0,
        budget: 60000.0,
        budget_by: "project",
        budget_is_monthly: false,
        notify_when_over_budget: true,
        over_budget_notification_percentage: 80.0,
        over_budget_notification_date: null,
        show_budget_to_all: false,
        cost_budget: 42000.0,
        cost_budget_include_expenses: false,
        fee: null,
        notes: "Updated project details",
        starts_on: "2025-01-01",
        ends_on: "2025-12-31",
        created_at: "2024-12-01T00:00:00Z",
        updated_at: "2025-09-10T10:00:00Z",
        client: {
          id: 5735776,
          name: "Acme Corporation",
          currency: "USD"
        }
      }
    });

    // Delete project endpoint
    this.responses.set('DELETE:/v2/projects/14307913', {
      status: 200,
      data: {}
    });

    // Tasks endpoints
    this.responses.set('GET:/v2/tasks', {
      status: 200,
      data: {
        tasks: [
          {
            id: 8083365,
            name: "Development",
            billable_by_default: true,
            default_hourly_rate: 100.0,
            is_default: false,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-06-01T00:00:00Z"
          },
          {
            id: 8083366,
            name: "Design",
            billable_by_default: true,
            default_hourly_rate: 90.0,
            is_default: false,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-06-01T00:00:00Z"
          },
          {
            id: 8083367,
            name: "Project Management",
            billable_by_default: true,
            default_hourly_rate: 110.0,
            is_default: false,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-06-01T00:00:00Z"
          }
        ],
        per_page: 2000,
        total_pages: 1,
        total_entries: 3,
        next_page: null,
        previous_page: null,
        page: 1,
        links: {
          first: "https://api.harvestapp.com/v2/tasks?page=1",
          next: null,
          previous: null,
          last: "https://api.harvestapp.com/v2/tasks?page=1"
        }
      }
    });

    // Individual task endpoint
    this.responses.set('GET:/v2/tasks/8083365', {
      status: 200,
      data: {
        id: 8083365,
        name: "Development",
        billable_by_default: true,
        default_hourly_rate: 100.0,
        is_default: false,
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-06-01T00:00:00Z"
      }
    });

    // Create task endpoint
    this.responses.set('POST:/v2/tasks', {
      status: 201,
      data: {
        id: 8083368,
        name: "New Task",
        billable_by_default: true,
        default_hourly_rate: null,
        is_default: false,
        is_active: true,
        created_at: "2025-09-10T00:00:00Z",
        updated_at: "2025-09-10T00:00:00Z"
      }
    });

    // Update task endpoint
    this.responses.set('PATCH:/v2/tasks/8083365', {
      status: 200,
      data: {
        id: 8083365,
        name: "Updated Development",
        billable_by_default: true,
        default_hourly_rate: 110.0,
        is_default: false,
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2025-09-10T10:00:00Z"
      }
    });

    // Delete task endpoint
    this.responses.set('DELETE:/v2/tasks/8083365', {
      status: 200,
      data: {}
    });

    // Project task assignments endpoints
    this.responses.set('GET:/v2/projects/14307913/task_assignments', {
      status: 200,
      data: {
        task_assignments: [
          {
            id: 155505014,
            billable: true,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-06-01T00:00:00Z",
            hourly_rate: 100.0,
            budget: null,
            task: {
              id: 8083365,
              name: "Development",
              billable_by_default: true,
              default_hourly_rate: 100.0,
              is_default: false,
              is_active: true,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-06-01T00:00:00Z"
            }
          },
          {
            id: 155505015,
            billable: true,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-06-01T00:00:00Z",
            hourly_rate: 90.0,
            budget: 5000.0,
            task: {
              id: 8083366,
              name: "Design",
              billable_by_default: true,
              default_hourly_rate: 90.0,
              is_default: false,
              is_active: true,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-06-01T00:00:00Z"
            }
          }
        ],
        per_page: 2000,
        total_pages: 1,
        total_entries: 2,
        next_page: null,
        previous_page: null,
        page: 1,
        links: {
          first: "https://api.harvestapp.com/v2/projects/14307913/task_assignments?page=1",
          next: null,
          previous: null,
          last: "https://api.harvestapp.com/v2/projects/14307913/task_assignments?page=1"
        }
      }
    });

    // Create project task assignment endpoint
    this.responses.set('POST:/v2/projects/14307913/task_assignments', {
      status: 201,
      data: {
        id: 155505016,
        billable: true,
        is_active: true,
        created_at: "2025-09-10T00:00:00Z",
        updated_at: "2025-09-10T00:00:00Z",
        hourly_rate: 110.0,
        budget: null,
        task: {
          id: 8083367,
          name: "Project Management",
          billable_by_default: true,
          default_hourly_rate: 110.0,
          is_default: false,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-06-01T00:00:00Z"
        }
      }
    });

    // Update project task assignment endpoint
    this.responses.set('PATCH:/v2/projects/14307913/task_assignments/155505014', {
      status: 200,
      data: {
        id: 155505014,
        billable: false,
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2025-09-10T10:00:00Z",
        hourly_rate: 105.0,
        budget: 10000.0,
        task: {
          id: 8083365,
          name: "Development",
          billable_by_default: true,
          default_hourly_rate: 100.0,
          is_default: false,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-06-01T00:00:00Z"
        }
      }
    });

    // Delete project task assignment endpoint
    this.responses.set('DELETE:/v2/projects/14307913/task_assignments/155505014', {
      status: 200,
      data: {}
    });

    // 404 responses for non-existent resources
    this.responses.set('GET:/v2/projects/999999999', {
      status: 404,
      data: { error: 'not_found', error_description: 'Project not found' },
      headers: {}
    });

    this.responses.set('GET:/v2/tasks/999999999', {
      status: 404,
      data: { error: 'not_found', error_description: 'Task not found' },
      headers: {}
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

  // Add missing HTTP methods to match axios interface
  async get(url: string, config?: any) {
    return this.request({ method: 'GET', url, headers: config?.headers });
  }

  async post(url: string, data?: any, config?: any) {
    return this.request({ method: 'POST', url, data, headers: config?.headers });
  }

  async patch(url: string, data?: any, config?: any) {
    return this.request({ method: 'PATCH', url, data, headers: config?.headers });
  }

  async put(url: string, data?: any, config?: any) {
    return this.request({ method: 'PUT', url, data, headers: config?.headers });
  }

  async delete(url: string, config?: any) {
    return this.request({ method: 'DELETE', url, headers: config?.headers });
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

    // Extract path from full URL and remove query parameters
    let urlPath = url.replace('https://api.harvestapp.com', '');
    // Remove query parameters for key lookup
    const baseUrlPath = urlPath.split('?')[0];
    const key = `${method.toUpperCase()}:${baseUrlPath}`;
    
    let response = this.responses.get(key);
    
    if (!response) {
      return this.responses.get('ERROR:404')!;
    }

    // Special handling for POST time_entries - differentiate between timer start and regular creation
    if (method.toUpperCase() === 'POST' && baseUrlPath === '/v2/time_entries' && config.data) {
      const data = config.data;
      
      // If no hours and no start/end time, this is likely a timer start
      const isTimerStart = !data.hours && !data.started_time && !data.ended_time;
      
      if (isTimerStart) {
        // Return a running timer response
        response = {
          status: 201,
          data: {
            ...response.data,
            hours: 0,
            hours_without_timer: 0,
            rounded_hours: 0,
            notes: data.notes || "Timer started for new task",
            timer_started_at: "2025-09-10T14:00:00Z",
            started_time: null,
            ended_time: null,
            is_running: true,
          }
        };
      } else if (data.started_time && data.ended_time) {
        // Return a time entry with the specified times
        response = {
          status: 201,
          data: {
            ...response.data,
            hours: 2.5, // Could calculate from times
            hours_without_timer: 2.5,
            rounded_hours: 2.5,
            notes: data.notes || "Morning development work",
            timer_started_at: null,
            started_time: data.started_time,
            ended_time: data.ended_time,
            is_running: false,
          }
        };
      }
      // For other cases (hours specified), keep the default response
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