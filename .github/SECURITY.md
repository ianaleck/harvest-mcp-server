# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: ianaleck@users.noreply.github.com
3. Include details: affected versions, reproduction steps, potential impact
4. You will receive acknowledgment within 48 hours
5. We'll work together to understand and resolve the issue

## Security Considerations for Contributors

### API Token Safety
- Never commit Harvest API tokens or credentials
- Use environment variables for all sensitive configuration
- Review `.gitignore` to ensure secrets are excluded

### Code Security
- All inputs are validated using Zod schemas
- API responses are validated before processing
- Rate limiting prevents abuse
- Error handling prevents information disclosure

### Dependencies
- Dependencies are scanned for vulnerabilities
- Keep dependencies updated
- Report suspicious packages

## Responsible Disclosure

We appreciate security researchers who help keep our users safe. We'll acknowledge your contribution once the issue is resolved.