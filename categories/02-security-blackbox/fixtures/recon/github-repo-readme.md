# TechMart - Modern E-Commerce Platform

> Built with Go, HTMX, and SQLite for blazing-fast server-rendered pages.

[![Build Status](https://github.com/techmart-app/server/actions/workflows/ci.yml/badge.svg)](https://github.com/techmart-app/server/actions)
[![Go Report Card](https://goreportcard.com/badge/github.com/techmart-app/server)](https://goreportcard.com/report/github.com/techmart-app/server)

## Overview

TechMart is a lightweight e-commerce platform designed for small-to-medium businesses. It uses server-side rendering with HTMX for interactive UI without heavy JavaScript frameworks.

## Tech Stack

- **Backend:** Go 1.22+ with standard library HTTP server
- **Frontend:** HTMX 1.9+ / Alpine.js 3.13+ for interactivity
- **Database:** SQLite 3.44+ (single-file, zero-config)
- **Auth:** JWT (HS256) with HTTP-only session cookies
- **Real-time:** WebSocket for notifications
- **API:** REST (v1 stable, v2 in beta with GraphQL support)

## Quick Start

```bash
# Clone the repo
git clone https://github.com/techmart-app/server.git
cd server

# Copy environment config
cp .env.example .env

# Default .env.example values:
#   APP_PORT=8080
#   APP_ENV=development
#   DB_PATH=./data/techmart.db
#   DB_PASSWORD=changeme_in_production
#   JWT_SECRET=dev-secret-key-replace-in-prod
#   SESSION_SECRET=another-dev-secret
#   ADMIN_EMAIL=admin@techmart.local
#   ADMIN_PASSWORD=admin123
#   DEBUG_MODE=true
#   CORS_ORIGINS=http://localhost:3000,http://localhost:8080
#   SMTP_HOST=smtp.mailtrap.io
#   SMTP_USER=techmart-dev
#   SMTP_PASS=devmail123

# Build and run
go build -o techmart ./cmd/server
./techmart

# Or use Docker
docker-compose up -d
```

## Project Structure

```
server/
  cmd/
    server/         - Entry point (main.go)
  handlers/         - HTTP request handlers
  middleware/       - Auth, CORS, rate-limiting, recovery
  database/        - SQLite queries and migrations
  models/          - Data models
  templates/       - Go HTML templates + HTMX partials
  static/          - JS bundles, CSS, images
  data/            - SQLite DB file (gitignored)
  migrations/      - SQL migration files
  .env.example     - Environment template
  docker-compose.yml
```

## API Documentation

Full API docs are available at `/docs` when running in development mode. The OpenAPI spec is at `/api/openapi.yaml`.

### Authentication

All API endpoints (except `/api/auth/login` and `/api/auth/register`) require a valid JWT token in the `Authorization: Bearer <token>` header.

Tokens expire after 24 hours. Use `/api/auth/refresh-token` to get a new token.

### Rate Limiting

- Auth endpoints: 5 requests/minute
- API endpoints: 100 requests/minute
- WebSocket: 1 connection per user

## Development

```bash
# Run tests
go test ./...

# Run with hot reload (requires air)
air

# Database migrations
go run ./cmd/migrate up

# Seed test data
go run ./cmd/seed
```

## Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for production setup guide.

**Important:** Always change default secrets before deploying to production. See `.env.example` for all configurable values.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

*TechMart v2.4.1-beta - Last updated March 2026*
