# ==========================================
# Stage 1: Build the application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency configurations
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy application source code
COPY . .

# Build the NestJS application
RUN npm run build

# ==========================================
# Stage 2: Run the production application
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Set node environment to production
ENV NODE_ENV=production

# Copy dependency configurations
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled build output from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose microservice HTTP port
EXPOSE 3000

# Start the NestJS application
CMD ["node", "dist/main"]
