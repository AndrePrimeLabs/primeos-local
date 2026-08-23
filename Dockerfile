# ============================================================================
# PRIMEOS DOCKERFILE - PRODUCTION OPTIMIZED WITH ARM64 SUPPORT
# Multi-stage build for minimal image size & maximum security
# ============================================================================
# Builds on amd64 to avoid ARM64 native binary issues
# Final image: ~150MB
# ============================================================================

# ============================================================================
# STAGE 1: BUILDER (amd64 base for compatibility)
# ============================================================================
FROM --platform=linux/amd64 node:20-alpine AS builder

WORKDIR /app

# Set build-time environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package files only (better layer caching)
COPY package*.json ./

# Install dependencies
# Use npm install with legacy peer deps handling
RUN npm install --prefer-offline --legacy-peer-deps --no-optional

# Copy entire source
COPY . .

# Build React app with Vite
RUN npm run build


# ============================================================================
# STAGE 2: PRODUCTION RUNTIME (native ARM64 for M1/M2)
# ============================================================================
FROM nginx:stable-alpine

# Metadata
LABEL maintainer="PrimeOS Team"
LABEL description="PrimeOS - Digital Operating System for Dental Clinics"
LABEL version="1.0.0"

# ============================================================================
# SECURITY & DEPENDENCIES
# ============================================================================
RUN addgroup -g 101 -S nginx || true && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

RUN apk add --no-cache \
    curl \
    ca-certificates \
    dumb-init

# ============================================================================
# NGINX SETUP
# ============================================================================
RUN rm -rf /usr/share/nginx/html/* && \
    rm -f /etc/nginx/conf.d/default.conf && \
    mkdir -p /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ============================================================================
# APPLICATION
# ============================================================================
# Copy built app from builder (amd64 builder, native runtime)
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# ============================================================================
# RUNTIME
# ============================================================================
ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

EXPOSE 80
