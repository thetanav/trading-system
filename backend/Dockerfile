# Multi-stage build for monorepo
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files for both backend and frontend
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
WORKDIR /app/backend
RUN npm ci --only=production

WORKDIR /app/frontend
RUN npm ci

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Build backend
WORKDIR /app/backend
RUN npm run generate
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy backend dependencies and built files
COPY --from=base /app/backend/dist ./dist
COPY --from=base /app/backend/node_modules ./node_modules
COPY --from=base /app/backend/package*.json ./
COPY --from=base /app/backend/drizzle ./drizzle
COPY --from=base /app/backend/scripts ./scripts

# Copy frontend build
COPY --from=base /app/frontend/dist ./frontend/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001

# Change ownership of the app directory
RUN chown -R appuser:nodejs /app
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
