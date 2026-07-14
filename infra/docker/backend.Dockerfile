# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY apps/backend ./apps/backend
COPY libs/shared-types ./libs/shared-types
RUN npm ci
RUN npm run build --workspace=libs/shared-types
RUN npm run build --workspace=apps/backend

# Runtime Stage
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/libs/shared-types/dist ./libs/shared-types/dist
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/backend/dist/server.js"]
