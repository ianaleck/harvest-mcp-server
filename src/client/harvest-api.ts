// Domain client imports
import { HarvestAPIOptions } from './base-client';
import { CompanyClient } from './company-client';
import { TimeEntriesClient } from './time-entries-client';
import { ProjectsClient } from './projects-client';
import { TasksClient } from './tasks-client';
import { ClientsClient } from './clients-client';
import { UsersClient } from './users-client';
import { InvoicesClient } from './invoices-client';
import { ExpensesClient } from './expenses-client';
import { EstimatesClient } from './estimates-client';
import { ReportsClient } from './reports-client';

// Type imports for backward compatibility
import { 
  type CreateTimeEntryInput,
  type UpdateTimeEntryInput,
  type TimeEntryQuery,
  type StartTimerInput,
  type StopTimerInput,
  type RestartTimerInput
} from '../schemas/time-entry';

import {
  type CreateClientInput,
  type UpdateClientInput,
  type ClientQuery
} from '../schemas/client';

import {
  type CreateUserInput,
  type UpdateUserInput,
  type UserQuery
} from '../schemas/user';

import {
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type InvoiceQuery
} from '../schemas/invoice';

import {
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type ExpenseQuery,
  type ExpenseCategoryQuery
} from '../schemas/expense';

import {
  type CreateEstimateInput,
  type UpdateEstimateInput,
  type EstimateQuery,
} from '../schemas/estimate';

import {
  type TimeReportQuery,
  type ExpenseReportQuery,
  type ProjectBudgetReportQuery,
  type UninvoicedReportQuery
} from '../schemas/report';

// Re-export HarvestAPIOptions from base client for backward compatibility
export { HarvestAPIOptions };

/**
 * HarvestAPIClient - Refactored to use domain-specific clients
 * Maintains 100% backward compatibility while delegating to specialized clients
 */
export class HarvestAPIClient {
  // Domain clients
  private readonly companyClient: CompanyClient;
  private readonly timeEntriesClient: TimeEntriesClient;
  private readonly projectsClient: ProjectsClient;
  private readonly tasksClient: TasksClient;
  private readonly clientsClient: ClientsClient;
  private readonly usersClient: UsersClient;
  private readonly invoicesClient: InvoicesClient;
  private readonly expensesClient: ExpensesClient;
  private readonly estimatesClient: EstimatesClient;
  private readonly reportsClient: ReportsClient;

  constructor(options: HarvestAPIOptions) {
    // Initialize all domain clients with the same options
    this.companyClient = new CompanyClient(options);
    this.timeEntriesClient = new TimeEntriesClient(options);
    this.projectsClient = new ProjectsClient(options);
    this.tasksClient = new TasksClient(options);
    this.clientsClient = new ClientsClient(options);
    this.usersClient = new UsersClient(options);
    this.invoicesClient = new InvoicesClient(options);
    this.expensesClient = new ExpensesClient(options);
    this.estimatesClient = new EstimatesClient(options);
    this.reportsClient = new ReportsClient(options);
  }

  // Company methods
  async getCompany(): Promise<any> {
    return this.companyClient.getCompany();
  }

  // Time entry methods
  async getTimeEntries(query?: TimeEntryQuery): Promise<any> {
    return this.timeEntriesClient.getTimeEntries(query);
  }

  async getTimeEntry(timeEntryId: number): Promise<any> {
    return this.timeEntriesClient.getTimeEntry(timeEntryId);
  }

  async createTimeEntry(input: CreateTimeEntryInput): Promise<any> {
    return this.timeEntriesClient.createTimeEntry(input);
  }

  async updateTimeEntry(input: UpdateTimeEntryInput): Promise<any> {
    return this.timeEntriesClient.updateTimeEntry(input);
  }

  async deleteTimeEntry(timeEntryId: number): Promise<void> {
    return this.timeEntriesClient.deleteTimeEntry(timeEntryId);
  }

  async startTimer(input: StartTimerInput): Promise<any> {
    return this.timeEntriesClient.startTimer(input);
  }

  async stopTimer(input: StopTimerInput): Promise<any> {
    return this.timeEntriesClient.stopTimer(input);
  }

  async restartTimer(input: RestartTimerInput): Promise<any> {
    return this.timeEntriesClient.restartTimer(input);
  }

  // Project methods
  async getProjects(query?: any): Promise<any> {
    return this.projectsClient.getProjects(query);
  }

  async getProject(projectId: number): Promise<any> {
    return this.projectsClient.getProject(projectId);
  }

  async createProject(input: any): Promise<any> {
    return this.projectsClient.createProject(input);
  }

  async updateProject(input: any): Promise<any> {
    return this.projectsClient.updateProject(input);
  }

  async deleteProject(projectId: number): Promise<void> {
    return this.projectsClient.deleteProject(projectId);
  }

  async getProjectTaskAssignments(projectId: number, query?: any): Promise<any> {
    return this.projectsClient.getProjectTaskAssignments(projectId, query);
  }

  async createProjectTaskAssignment(projectId: number, input: any): Promise<any> {
    return this.projectsClient.createProjectTaskAssignment(projectId, input);
  }

  async updateProjectTaskAssignment(projectId: number, input: any): Promise<any> {
    return this.projectsClient.updateProjectTaskAssignment(projectId, input);
  }

  async deleteProjectTaskAssignment(projectId: number, taskAssignmentId: number): Promise<void> {
    return this.projectsClient.deleteProjectTaskAssignment(projectId, taskAssignmentId);
  }

  // Task methods
  async getTasks(query?: any): Promise<any> {
    return this.tasksClient.getTasks(query);
  }

  async getTask(taskId: number): Promise<any> {
    return this.tasksClient.getTask(taskId);
  }

  async createTask(input: any): Promise<any> {
    return this.tasksClient.createTask(input);
  }

  async updateTask(input: any): Promise<any> {
    return this.tasksClient.updateTask(input);
  }

  async deleteTask(taskId: number): Promise<void> {
    return this.tasksClient.deleteTask(taskId);
  }

  // Client methods
  async getClients(query?: ClientQuery): Promise<any> {
    return this.clientsClient.getClients(query);
  }

  async getClient(clientId: number): Promise<any> {
    return this.clientsClient.getClient(clientId);
  }

  async createClient(input: CreateClientInput): Promise<any> {
    return this.clientsClient.createClient(input);
  }

  async updateClient(input: UpdateClientInput): Promise<any> {
    return this.clientsClient.updateClient(input);
  }

  async deleteClient(clientId: number): Promise<void> {
    return this.clientsClient.deleteClient(clientId);
  }

  // User methods
  async getUsers(query?: UserQuery): Promise<any> {
    return this.usersClient.getUsers(query);
  }

  async getUser(userId: number): Promise<any> {
    return this.usersClient.getUser(userId);
  }

  async createUser(input: CreateUserInput): Promise<any> {
    return this.usersClient.createUser(input);
  }

  async updateUser(input: UpdateUserInput): Promise<any> {
    return this.usersClient.updateUser(input);
  }

  async deleteUser(userId: number): Promise<void> {
    return this.usersClient.deleteUser(userId);
  }

  async getCurrentUser(): Promise<any> {
    return this.usersClient.getCurrentUser();
  }

  // Invoice methods
  async getInvoices(query?: InvoiceQuery): Promise<any> {
    return this.invoicesClient.getInvoices(query);
  }

  async getInvoice(invoiceId: number): Promise<any> {
    return this.invoicesClient.getInvoice(invoiceId);
  }

  async createInvoice(input: CreateInvoiceInput): Promise<any> {
    return this.invoicesClient.createInvoice(input);
  }

  async updateInvoice(input: UpdateInvoiceInput): Promise<any> {
    return this.invoicesClient.updateInvoice(input);
  }

  async deleteInvoice(invoiceId: number): Promise<void> {
    return this.invoicesClient.deleteInvoice(invoiceId);
  }

  // Expense methods
  async getExpenses(query?: ExpenseQuery): Promise<any> {
    return this.expensesClient.getExpenses(query);
  }

  async getExpense(expenseId: number): Promise<any> {
    return this.expensesClient.getExpense(expenseId);
  }

  async createExpense(input: CreateExpenseInput): Promise<any> {
    return this.expensesClient.createExpense(input);
  }

  async updateExpense(input: UpdateExpenseInput): Promise<any> {
    return this.expensesClient.updateExpense(input);
  }

  async deleteExpense(expenseId: number): Promise<void> {
    return this.expensesClient.deleteExpense(expenseId);
  }

  async getExpenseCategories(query?: ExpenseCategoryQuery): Promise<any> {
    return this.expensesClient.getExpenseCategories(query);
  }

  // Estimate methods
  async getEstimates(query?: EstimateQuery): Promise<any> {
    return this.estimatesClient.getEstimates(query);
  }

  async getEstimate(estimateId: number): Promise<any> {
    return this.estimatesClient.getEstimate(estimateId);
  }

  async createEstimate(input: CreateEstimateInput): Promise<any> {
    return this.estimatesClient.createEstimate(input);
  }

  async updateEstimate(input: UpdateEstimateInput): Promise<any> {
    return this.estimatesClient.updateEstimate(input);
  }

  async deleteEstimate(estimateId: number): Promise<void> {
    return this.estimatesClient.deleteEstimate(estimateId);
  }

  // Report methods
  async getTimeReport(query: TimeReportQuery): Promise<any> {
    return this.reportsClient.getTimeReport(query);
  }

  async getExpenseReport(query: ExpenseReportQuery): Promise<any> {
    return this.reportsClient.getExpenseReport(query);
  }

  async getProjectBudgetReport(query?: ProjectBudgetReportQuery): Promise<any> {
    return this.reportsClient.getProjectBudgetReport(query);
  }

  async getUninvoicedReport(query: UninvoicedReportQuery): Promise<any> {
    return this.reportsClient.getUninvoicedReport(query);
  }

  async close(): Promise<void> {
    // Close all domain clients
    await Promise.all([
      this.companyClient.close(),
      this.timeEntriesClient.close(),
      this.projectsClient.close(),
      this.tasksClient.close(),
      this.clientsClient.close(),
      this.usersClient.close(),
      this.invoicesClient.close(),
      this.expensesClient.close(),
      this.estimatesClient.close(),
      this.reportsClient.close(),
    ]);
  }
}