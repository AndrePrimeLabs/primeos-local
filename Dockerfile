# ============================================================================
# PRIMEOS DOCKERFILE - PRODUCTION OPTIMIZED FOR NODE 26
# Multi-stage build with pre-built dist for maximum compatibility
# ============================================================================
# Strategy: Build locally on host, copy to Docker
# This avoids native binary issues across architectures
# ============================================================================

# ============================================================================
# STAGE 1: PRODUCTION RUNTIME
# ============================================================================
# Lightweight nginx container with built app
# Final size: ~150MB

FROM nginx:stable-alpine

# Metadata
LABEL maintainer="PrimeOS Team"
LABEL description="PrimeOS - Digital Operating System for Dental Clinics"
LABEL version="1.0.0"
LABEL node="26-alpine"

# ============================================================================
# SECURITY: Non-root user
# ============================================================================
RUN addgroup -g 101 -S nginx || true && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

# ============================================================================
# DEPENDENCIES
# ============================================================================
RUN apk add --no-cache \
    curl \
    ca-certificates \
    dumb-init \
    tini

# ============================================================================
# NGINX CONFIGURATION
# ============================================================================
RUN rm -rf /usr/share/nginx/html/* && \
    rm -f /etc/nginx/conf.d/default.conf && \
    mkdir -p /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Copy optimized nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ============================================================================
# APPLICATION
# ============================================================================
# Copy pre-built dist folder from local build
# Build on host: npm run build
# This avoids native binary compilation issues in Docker

COPY --chown=nginx:nginx dist /usr/share/nginx/html

# ============================================================================
# RUNTIME
# ============================================================================
ENTRYPOINT ["tini", "--"]
CMD ["nginx", "-g", "daemon off;"]

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

EXPOSE 80

# ============================================================================
# USAGE
# ============================================================================
# Build locally:
#   npm run build
#
# Build Docker image:
#   docker build -t primeos:latest .
#
# Run container:
#   docker run -p 80:80 primeos:latest
#
# Or with Docker Compose:
#   docker compose -f docker-compose.local.yml up --build
#
# ============================================================================
