# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY apps/frontend ./apps/frontend
RUN npm ci
RUN npm run build --workspace=apps/frontend

# Server Stage
FROM nginx:alpine
COPY --from=builder /app/apps/frontend/dist/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
