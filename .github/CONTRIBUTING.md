# Contributing to Harvest MCP Server

## Security First

Before contributing, please review our [Security Policy](.github/SECURITY.md) and ensure your contributions follow these security guidelines:

### 🔒 Never Commit Secrets
- API tokens, passwords, or credentials
- Private keys or certificates  
- Internal URLs or hostnames
- Test data with real user information

### ✅ Security Checklist
- [ ] All inputs validated with Zod schemas
- [ ] Error messages don't leak sensitive information
- [ ] No hardcoded credentials or tokens
- [ ] Dependencies are secure and up-to-date
- [ ] Rate limiting respected in API calls

## Development Setup

1. **Fork and clone the repository**
2. **Install dependencies**: `npm install`
3. **Run tests**: `npm test`
4. **Run linting**: `npm run lint`

## Code Standards

- **TypeScript**: Strict type checking enabled
- **Testing**: Write tests for all new functionality
- **Documentation**: JSDoc comments for public APIs
- **Security**: Input validation with Zod schemas

## Pull Request Process

1. Create a feature branch from `master`
2. Make your changes following code standards
3. Run the full test suite: `npm test`
4. Run linting: `npm run lint`
5. Submit PR using the provided template
6. Address any security scan findings

## Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities. Email security concerns to ianaleck@users.noreply.github.com with details about the issue.