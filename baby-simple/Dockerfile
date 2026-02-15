# Stage 1: Build stage
FROM node:20-alpine AS builder

# Skip Playwright browser downloads
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Copy Prisma schema first (needed for generate during install)
COPY prisma ./prisma

# Install dependencies (including dev dependencies for build)
RUN npm ci || npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production runtime stage
FROM node:20-alpine AS runner

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Set working directory
WORKDIR /app

# Create non-root user for security (Railway runs as non-root by default)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built artifacts and necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Install only production dependencies (if needed, but we already copied node_modules)
# RUN npm ci --only=production && npm cache clean --force

# Switch to non-root user
USER nextjs

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
