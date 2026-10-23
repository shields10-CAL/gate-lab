# syntax=docker/dockerfile:1
# GateLab is a static React/Vite web app: build once, serve with Nginx.
FROM node:22-alpine AS build
WORKDIR /app

# npm ci is used automatically if a lockfile is added later.
COPY package*.json ./
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

COPY . .
RUN npm run build

FROM nginx:1.28-alpine AS runtime
LABEL org.opencontainers.image.title="GateLab" \
      org.opencontainers.image.description="Classroom digital logic simulator" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.licenses="MIT"

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80

# Alpine's BusyBox wget is available in the official Nginx Alpine image.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
