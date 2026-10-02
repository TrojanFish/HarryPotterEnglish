# ==========================================
# Hogwarts Audio English Learning Platform
# Production Dockerfile (Multi-stage Build)
# ==========================================

# Stage 1: Build the Vite React Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies for build
RUN npm install

# Copy application source code
COPY . .

# Build the optimized production SPA into /app/dist
RUN npm run build

# Stage 2: Lightweight Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server code and data
COPY server ./server
COPY src/data ./src/data

# Expose default application port
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Start unified application server (serves frontend SPA & R2 APIs)
CMD ["node", "server/index.js"]
