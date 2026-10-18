# Stage 1: Build Vite static assets
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Build-time environment variable arguments
ARG VITE_API_BASE_URL=/api
ARG VITE_FLOOD_API_BASE_URL=/api/flood
ARG VITE_HEALTH_URL=/api/health

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_FLOOD_API_BASE_URL=$VITE_FLOOD_API_BASE_URL
ENV VITE_HEALTH_URL=$VITE_HEALTH_URL

# Copy source code and build config
COPY index.html vite.config.ts tsconfig.json ./
COPY public ./public
COPY src ./src

# Compile and bundle static assets
RUN npm run build

# Stage 2: Serve static bundle via Nginx reverse proxy
FROM nginx:1.27-alpine AS runner

# Clean default configuration and html files
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy customized Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:80/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
