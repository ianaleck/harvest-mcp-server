# 🌾 Harvest MCP Server

[![npm version](https://badge.fury.io/js/@ianaleck%2Fharvest-mcp-server.svg)](https://www.npmjs.com/package/@ianaleck/harvest-mcp-server)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/Tests-Passing-green)](https://github.com/ianaleck/harvest-mcp-server)

> **Unofficial** Model Context Protocol (MCP) server for seamless integration with the Harvest time tracking API

**⚠️ Disclaimer:** This is an unofficial, third-party integration with the Harvest API. This project is not affiliated with, endorsed by, or sponsored by Harvest or Forecast (the company behind Harvest).

## ✨ Features

- 🔗 **Complete Harvest API v2 Coverage** - 40+ tools covering all major endpoints
- 🛡️ **Type-Safe** - Full TypeScript support with Zod validation
- ⚡ **High Performance** - Built with async/await and proper rate limiting
- 🧪 **Thoroughly Tested** - Comprehensive unit, integration, and contract tests
- 📊 **Rich Logging** - Structured logging for debugging and monitoring
- 🔄 **Auto-Retry** - Intelligent retry logic with exponential backoff
- 📖 **MCP Compliant** - Works with Claude Desktop and other MCP clients

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Harvest account with API access
- MCP-compatible client (like Claude Desktop)

### Installation

```bash
# Install globally
npm install -g @ianaleck/harvest-mcp-server

# Or install locally
npm install @ianaleck/harvest-mcp-server
```

### Configuration

1. **Get your Harvest API credentials:**
   - Go to Harvest → Settings → Developers → Personal Access Tokens
   - Create a new token
   - Note your Account ID (visible in URL or settings)

2. **Configure your MCP client** (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "harvest": {
      "command": "npx",
      "args": ["-y", "@ianaleck/harvest-mcp-server"],
      "env": {
        "HARVEST_ACCESS_TOKEN": "your_harvest_personal_access_token",
        "HARVEST_ACCOUNT_ID": "your_harvest_account_id"
      }
    }
  }
}
```

3. **Start using with Claude!**

## 🎯 What You Can Do

Once connected, you can ask Claude to help with:

### ⏱️ Time Tracking
- "Show me all my time entries for this week"
- "Start a timer for the 'Development' task on the 'Website Project'"
- "How many hours did I work on Project X last month?"

### 📋 Project Management  
- "List all active projects for client Acme Corp"
- "Create a new project called 'Mobile App' for client TechStart"
- "Show me project budget vs actual time spent"

### 👥 Team Management
- "Who are all the users in our Harvest account?"
- "Show me John's time entries for last week"

### 💰 Financial Tracking
- "Generate an expense report for Q4"
- "Show me all unpaid invoices"
- "What's our total billable hours this month?"

## 🛠️ Available Tools

<details>
<summary><strong>📊 Company & Account (1 tool)</strong></summary>

- `get_company` - Get company information and settings
</details>

<details>
<summary><strong>⏰ Time Entries (8 tools)</strong></summary>

- `list_time_entries` - List time entries with filtering
- `get_time_entry` - Get specific time entry details  
- `create_time_entry` - Create new time entry
- `update_time_entry` - Update existing time entry
- `delete_time_entry` - Delete time entry
- `start_timer` - Start a timer for a task
- `stop_timer` - Stop running timer
- `restart_timer` - Restart a previous time entry
</details>

<details>
<summary><strong>🏗️ Projects (7 tools)</strong></summary>

- `list_projects` - List all projects with filtering
- `get_project` - Get specific project details
- `create_project` - Create new project
- `update_project` - Update project details
- `delete_project` - Delete project
- `list_project_task_assignments` - List task assignments for project
- `create_project_task_assignment` - Assign task to project
- `update_project_task_assignment` - Update task assignment
- `delete_project_task_assignment` - Remove task assignment
</details>

<details>
<summary><strong>📝 Tasks (5 tools)</strong></summary>

- `list_tasks` - List all tasks
- `get_task` - Get specific task details
- `create_task` - Create new task
- `update_task` - Update task details  
- `delete_task` - Delete task
</details>

<details>
<summary><strong>🏢 Clients (5 tools)</strong></summary>

- `list_clients` - List all clients
- `get_client` - Get specific client details
- `create_client` - Create new client
- `update_client` - Update client details
- `delete_client` - Delete client
</details>

<details>
<summary><strong>👤 Users (6 tools)</strong></summary>

- `list_users` - List all users in account
- `get_user` - Get specific user details
- `get_current_user` - Get current authenticated user
- `create_user` - Create new user
- `update_user` - Update user details
- `delete_user` - Delete user
</details>

<details>
<summary><strong>💸 Expenses (6 tools)</strong></summary>

- `list_expenses` - List expenses with filtering
- `get_expense` - Get specific expense details
- `create_expense` - Create new expense
- `update_expense` - Update expense details
- `delete_expense` - Delete expense
- `list_expense_categories` - List all expense categories
</details>

<details>
<summary><strong>🧾 Invoices (5 tools)</strong></summary>

- `list_invoices` - List invoices with filtering
- `get_invoice` - Get specific invoice details
- `create_invoice` - Create new invoice
- `update_invoice` - Update invoice details
- `delete_invoice` - Delete invoice
</details>

<details>
<summary><strong>📋 Estimates (5 tools)</strong></summary>

- `list_estimates` - List estimates with filtering
- `get_estimate` - Get specific estimate details
- `create_estimate` - Create new estimate
- `update_estimate` - Update estimate details
- `delete_estimate` - Delete estimate
</details>

<details>
<summary><strong>📈 Reports (4 tools)</strong></summary>

- `get_time_report` - Generate time reports with filtering
- `get_expense_report` - Generate expense reports
- `get_project_budget_report` - Get project budget analysis
- `get_uninvoiced_report` - Get uninvoiced time and expenses
</details>

## 🧪 Development

### Setup

```bash
git clone https://github.com/ianaleck/harvest-mcp-server.git
cd harvest-mcp-server
npm install
```

### Environment Configuration

```bash
cp .env.example .env
# Edit .env with your Harvest API credentials
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:contract
```

### Building

```bash
# Build for production
npm run build

# Start development server
npm run dev
```

## 📋 API Requirements

This server requires a Harvest account with API access. Users must comply with:

- [Harvest API Terms of Service](https://help.getharvest.com/api-v2/introduction/overview/general/)
- [Harvest API Rate Limits](https://help.getharvest.com/api-v2/introduction/overview/general/#rate-limiting) (100 requests per 15 seconds)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Harvest](https://www.getharvest.com/) for providing an excellent time tracking API
- [Model Context Protocol](https://modelcontextprotocol.io/) team for the MCP specification
- [Anthropic](https://www.anthropic.com/) for Claude and the MCP SDK

## 📞 Support

- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/ianaleck/harvest-mcp-server/issues)
- 💡 **Feature Requests:** [GitHub Discussions](https://github.com/ianaleck/harvest-mcp-server/discussions)
- 📖 **Documentation:** [MCP Documentation](https://modelcontextprotocol.io/docs)

---

<div align="center">

**Made with ❤️ for the MCP community**

[⭐ Star this project](https://github.com/ianaleck/harvest-mcp-server) if you find it useful!

</div>