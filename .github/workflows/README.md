# GitHub Actions Setup

## Automated Publishing

This repository is configured to automatically publish to both npm and GitHub Packages when releases are created.

### Required Secrets

To enable automated publishing, you need to set up the following secrets in your GitHub repository:

#### NPM_TOKEN
1. Go to [npm.com](https://www.npmjs.com) and log in
2. Go to **Account Settings** → **Access Tokens**
3. Click **Generate New Token** → **Classic Token**
4. Select **Automation** scope
5. Copy the token
6. In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions**
7. Click **New repository secret**
8. Name: `NPM_TOKEN`
9. Value: paste your npm token

#### GITHUB_TOKEN
- This is automatically provided by GitHub Actions, no setup required

### How It Works

The workflow triggers on:
- **Release published**: Automatically publishes when you create a new GitHub release
- **Manual dispatch**: You can manually trigger publishing from the Actions tab

### Publishing Process

1. **Tests**: Runs the full test suite
2. **Build**: Compiles TypeScript to JavaScript
3. **Publish to npm**: Publishes to the main npm registry
4. **Publish to GitHub**: Publishes to GitHub Packages registry

### Manual Release Process

1. Update version: `npm version patch|minor|major`
2. Push changes: `git push origin main --tags`
3. Create GitHub release from the pushed tag
4. The workflow will automatically publish to both registries

### Installing from Different Registries

**From npm (recommended):**
```bash
npm install @ianaleck/harvest-mcp-server
```

**From GitHub Packages:**
```bash
# First, configure npm to use GitHub registry for @ianaleck scope
npm config set @ianaleck:registry https://npm.pkg.github.com
# Authenticate (requires GitHub token with packages:read scope)
npm login --scope=@ianaleck --registry=https://npm.pkg.github.com
# Install
npm install @ianaleck/harvest-mcp-server
```