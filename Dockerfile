##############################
# Harvest MCP Server Dockerfile
# Multi-stage build for small production image
##############################

# 1. Base deps (pinned node major per engines)
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
		NODE_ENV=production
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && \
		apt-get update && apt-get install -y --no-install-recommends dumb-init ca-certificates curl && \
		rm -rf /var/lib/apt/lists/*
WORKDIR /app

# 2. Dependencies (use pnpm for deterministic installs; fallback to npm if lockfile absent)
FROM base AS deps
# Install ALL dependencies (including dev) needed for TypeScript build
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN if [ -f pnpm-lock.yaml ]; then \
			corepack use pnpm && pnpm install --frozen-lockfile; \
		elif [ -f package-lock.json ]; then \
			npm ci; \
		else \
			npm install; \
		fi

# 3. Build (include dev deps for TypeScript compile)
FROM deps AS build
ENV NODE_ENV=development
COPY tsconfig.json tsconfig.*.json* ./
COPY src ./src
RUN if [ -f pnpm-lock.yaml ]; then \
			corepack use pnpm && pnpm run build; \
		else \
			npm run build; \
		fi

# 4. Production runtime image (copy only needed files)
FROM base AS prod-deps
# Re-install only production dependencies for slimmer final image
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN if [ -f pnpm-lock.yaml ]; then \
			corepack use pnpm && pnpm install --frozen-lockfile --prod; \
		elif [ -f package-lock.json ]; then \
			npm ci --omit=dev; \
		else \
			npm install --omit=dev; \
		fi

FROM node:20-bookworm-slim AS runtime
LABEL org.opencontainers.image.source="https://github.com/ianaleck/harvest-mcp-server" \
			org.opencontainers.image.title="harvest-mcp-server" \
			org.opencontainers.image.description="Model Context Protocol server for Harvest API v2" \
			org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production \
		HARVEST_API_BASE_URL=https://api.harvestapp.com/v2 \
		LOG_LEVEL=info \
		REQUEST_TIMEOUT_MS=30000 \
		MAX_RETRIES=3 \
		RATE_LIMIT_REQUESTS_PER_SECOND=100 \
		RATE_LIMIT_BURST_SIZE=200

# Create non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs && \
		apt-get update && apt-get install -y --no-install-recommends dumb-init ca-certificates && \
		rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy only production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules
# Copy built dist
COPY --from=build /app/dist ./dist
# Include package.json for metadata (no scripts executed at runtime)
COPY package.json ./

# Ensure binary is executable
RUN chmod +x dist/index.js

USER nodejs
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]

# Expose default HTTP port (only used if MCP_TRANSPORT=http)
EXPOSE 3000

# Healthcheck: attempt to list tools via MCP protocol basics (stdout transport is used, so simple node -e test)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD node -e "require('./dist/index.js'); process.exit(0)" || exit 1

# Required environment variables (HARVEST_ACCESS_TOKEN, HARVEST_ACCOUNT_ID) must be provided at runtime.
# To enable HTTP transport instead of stdio, set MCP_TRANSPORT=http (optionally MCP_API_KEY for auth and PORT to override 3000).
## Example HTTP run:
# docker run --rm -p 3000:3000 \
#   -e MCP_TRANSPORT=http \
#   -e MCP_API_KEY=secret \
#   -e HARVEST_ACCESS_TOKEN=xxxxx \
#   -e HARVEST_ACCOUNT_ID=123456 \
#   mabunixda/harvest-mcp-server:latest

