# NovaCorp Engineering Knowledge Base
## Last Updated: 2026-03-15

---

## Table of Contents
1. Team Directory
2. Architecture Overview
3. API Documentation
4. Incident Runbooks
5. Deployment Procedures
6. Meeting Notes Archive
7. Onboarding Checklist
8. Third-Party Integrations
9. Security Policies
10. Internal Tools

---

## 1. Team Directory

### Engineering Leadership

| Name | Role | Email | Slack | Timezone |
|------|------|-------|-------|----------|
| Marcus Chen | VP of Engineering | marcus.chen@novacorp.io | @marcus | PST (UTC-8) |
| Priya Sharma | Director of Platform | priya.sharma@novacorp.io | @priya | IST (UTC+5:30) |
| James O'Sullivan | Director of Security | james.osullivan@novacorp.io | @josullivan | GMT (UTC+0) |

### Platform Team (Team Nimbus)

**Team Lead:** Priya Sharma
**Sprint Cadence:** 2-week sprints, starts Monday
**Standup:** Daily 10:00 AM IST / 9:30 PM PST

| Name | Role | Joined | Focus Area |
|------|------|--------|------------|
| Aisha Patel | Senior Backend Engineer | 2024-01-15 | API Gateway, Auth |
| Tomasz Kowalski | Backend Engineer | 2024-06-01 | Data Pipeline, Kafka |
| Lin Wei | Full Stack Engineer | 2023-09-20 | Dashboard, React |
| Roberto Diaz | SRE | 2025-02-10 | Kubernetes, Monitoring |
| Yuki Tanaka | Junior Engineer | 2025-08-01 | Documentation, Testing |

**Nimbus OKRs Q1 2026:**
- O1: Reduce API p99 latency to under 200ms (currently 340ms)
- O2: Migrate 80% of services to Kubernetes (currently at 45%)
- O3: Implement zero-downtime deploys for all tier-1 services

### Security Team (Team Aegis)

**Team Lead:** James O'Sullivan
**Sprint Cadence:** 1-week sprints
**Standup:** Daily 9:00 AM GMT

| Name | Role | Joined | Focus Area |
|------|------|--------|------------|
| Sarah Kim | Security Engineer | 2023-03-10 | Pentesting, Bug Bounty |
| Dmitri Volkov | Security Analyst | 2024-11-15 | SIEM, Threat Intel |
| Fatima Al-Hassan | AppSec Engineer | 2025-01-20 | Code Review, SAST |

**Aegis OKRs Q1 2026:**
- O1: Achieve SOC 2 Type II certification by March 31
- O2: Reduce mean time to remediate critical vulns to under 48 hours
- O3: Deploy DAST scanning in all CI/CD pipelines

### Frontend Team (Team Prism)

**Team Lead:** Elena Rodriguez (elena.r@novacorp.io)
**Sprint Cadence:** 2-week sprints
**Standup:** Daily 11:00 AM EST

| Name | Role | Joined | Focus Area |
|------|------|--------|------------|
| Jake Morrison | Senior Frontend Engineer | 2023-06-15 | Design System, A11y |
| Mei-Ling Huang | Frontend Engineer | 2024-03-01 | Performance, PWA |
| Arjun Nair | UI/UX Engineer | 2024-09-15 | Figma, Prototyping |

---

## 2. Architecture Overview

### System Diagram (Text)

```
                    [CloudFlare CDN]
                         |
                    [API Gateway]
                    (Kong v3.4.2)
                    port: 8443
                         |
          +--------------+--------------+
          |              |              |
    [Auth Service]  [Core API]   [Search Service]
    (Go 1.22)      (Node 20)    (Python 3.12)
    port: 3001     port: 3000   port: 3002
          |              |              |
          +--------------+--------------+
                         |
                  [PostgreSQL 16.2]
                  host: db-primary.internal
                  port: 5432
                  database: novacorp_prod
                         |
                  [Redis 7.2]
                  host: cache-01.internal
                  port: 6379
                  database: 0 (sessions)
                  database: 1 (cache)
                  database: 2 (rate-limit)
```

### Service Registry

| Service | Language | Port | Owner Team | Repo |
|---------|----------|------|------------|------|
| api-gateway | Kong Config | 8443 | Platform | novacorp/gateway |
| auth-service | Go 1.22 | 3001 | Platform | novacorp/auth |
| core-api | Node.js 20 | 3000 | Platform | novacorp/core |
| search-service | Python 3.12 | 3002 | Platform | novacorp/search |
| notification-service | Go 1.22 | 3003 | Platform | novacorp/notify |
| billing-service | Java 21 | 3004 | Revenue | novacorp/billing |
| analytics-service | Python 3.12 | 3005 | Data | novacorp/analytics |
| admin-dashboard | React 18 | 8080 | Frontend | novacorp/admin-ui |
| public-website | Next.js 14 | 3006 | Frontend | novacorp/website |
| ml-pipeline | Python 3.12 | 3007 | Data | novacorp/ml |

### Database Schema (Key Tables)

```sql
-- Users table (partitioned by created_at)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',  -- user, admin, superadmin
    mfa_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    org_id UUID REFERENCES organizations(id)
);

-- API Keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    key_prefix VARCHAR(8) NOT NULL,  -- First 8 chars for lookup
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    scopes TEXT[] DEFAULT '{}',
    rate_limit INTEGER DEFAULT 100,   -- requests per minute
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

-- Audit log table
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Note:** The `api_keys.rate_limit` column defaults to 100 requests/minute for standard users. Enterprise tier gets 500 requests/minute. See section 9 (Security Policies) for the updated rate limit policy.

---

## 3. API Documentation

### Authentication

All API requests require authentication via Bearer token or API key.

**Bearer Token (OAuth 2.0):**
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```
Tokens expire after 1 hour. Refresh tokens are valid for 30 days.

**API Key:**
```
X-API-Key: nvc_live_8a3f2b1c9d4e5f6a7b8c9d0e
```
API key format: `nvc_{environment}_{32_char_hex}`
Environments: `live`, `test`, `staging`

### Core Endpoints

#### GET /api/v2/users
**Rate Limit:** 100 req/min (standard), 500 req/min (enterprise)
**Auth:** Bearer token with `users:read` scope

Parameters:
- `page` (int, default: 1)
- `per_page` (int, default: 20, max: 100)
- `sort` (string: `created_at`, `email`, `last_login_at`)
- `filter[role]` (string: `user`, `admin`, `superadmin`)
- `filter[org_id]` (uuid)

Response:
```json
{
  "data": [...],
  "meta": {
    "total": 1523,
    "page": 1,
    "per_page": 20,
    "total_pages": 77
  }
}
```

#### POST /api/v2/users
**Rate Limit:** 10 req/min
**Auth:** Bearer token with `users:write` scope

#### GET /api/v2/search
**Rate Limit:** 50 req/min
**Auth:** API key or Bearer token
**Engine:** Elasticsearch 8.12

Parameters:
- `q` (string, required) - Search query
- `type` (string: `all`, `users`, `documents`, `tickets`)
- `from` (int, default: 0)
- `size` (int, default: 10, max: 50)

#### POST /api/v2/webhooks
**Rate Limit:** 5 req/min
**Auth:** Bearer token with `webhooks:manage` scope
**Retry Policy:** 3 retries with exponential backoff (1s, 5s, 25s)
**Timeout:** 30 seconds per delivery attempt
**Signature:** HMAC-SHA256 of payload using webhook secret

### Deprecated Endpoints (Remove by Q3 2026)

> **WARNING:** These v1 endpoints are deprecated and will be removed July 1, 2026.
> Migration guide: https://docs.novacorp.io/migration/v1-to-v2

- `GET /api/v1/users` -> Use `GET /api/v2/users`
- `POST /api/v1/search` -> Use `GET /api/v2/search` (method changed to GET)
- `GET /api/v1/reports` -> Use `GET /api/v2/analytics/reports`

---

## 4. Incident Runbooks

### INC-001: Database Connection Pool Exhaustion

**Severity:** P1
**Last Triggered:** 2026-02-14 (Valentine's Day traffic spike)
**On-Call Escalation:** Platform Team -> VP Engineering

**Symptoms:**
- API response times > 5 seconds
- Error rate spikes above 10%
- PostgreSQL `max_connections` errors in logs
- Grafana alert: `db_pool_utilization > 90%`

**Resolution Steps:**
1. Check current connections: `SELECT count(*) FROM pg_stat_activity;`
2. Kill idle connections older than 5 min:
   ```sql
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity
   WHERE state = 'idle' AND query_start < NOW() - INTERVAL '5 minutes';
   ```
3. If still saturated, increase pool size temporarily:
   - Edit `core-api/config/database.yml`
   - Change `pool_size` from 20 to 40
   - Restart core-api pods: `kubectl rollout restart deployment/core-api -n production`
4. Notify #incidents channel with status update
5. Post-incident: File capacity planning ticket

**Root Cause History:**
- 2026-02-14: Traffic 3x normal due to promo campaign. Pool size was 20, needed 45.
- 2025-11-03: Leaked connections from analytics service. Fixed with connection timeout.
- 2025-06-22: Slow query on users table blocked pool. Added index on `last_login_at`.

### INC-002: Redis Cache Failure

**Severity:** P2
**Last Triggered:** 2026-01-08
**On-Call Escalation:** Platform Team

**Symptoms:**
- Cache miss rate > 50%
- Session creation failures
- Rate limiting stops working

**Resolution Steps:**
1. Check Redis health: `redis-cli -h cache-01.internal ping`
2. Check memory: `redis-cli info memory | grep used_memory_human`
3. If OOM, flush non-critical caches:
   ```
   redis-cli -n 1 FLUSHDB  # cache database only
   ```
   **NEVER flush database 0 (sessions) or 2 (rate-limit)**
4. Check replication lag if using replicas
5. Consider failover to cache-02.internal if cache-01 unrecoverable

### INC-003: Certificate Expiry

**Severity:** P1
**Last Triggered:** 2025-09-17 (wildcard cert for *.novacorp.io expired)
**On-Call Escalation:** Security Team -> Platform Team

**Note:** After the September 2025 incident, we migrated to Let's Encrypt with auto-renewal via cert-manager. Certificates now auto-renew 30 days before expiry. Manual renewal should no longer be needed.

**Current Certificate Details:**
- Issuer: Let's Encrypt
- Domain: *.novacorp.io
- Renewal: Automatic via cert-manager v1.14
- Alert: Fires when cert expires in < 14 days

---

## 5. Deployment Procedures

### Production Deploy Checklist

**Deploy Window:** Tuesday and Thursday, 2:00 PM - 4:00 PM UTC
**Freeze Periods:**
- Last week of each quarter (no deploys)
- Black Friday through Cyber Monday
- December 20 - January 3

**Pre-deploy:**
1. All tests passing on `main` branch
2. PR approved by at least 2 reviewers
3. Security scan (Snyk) shows no critical vulnerabilities
4. Load test results within 10% of baseline
5. Rollback plan documented in deploy ticket

**Deploy Process:**
```bash
# 1. Tag the release
git tag -a v2.14.0 -m "Release 2.14.0"
git push origin v2.14.0

# 2. Deploy to staging first
kubectl apply -f k8s/staging/ -n staging

# 3. Run smoke tests
./scripts/smoke-test.sh staging

# 4. Deploy to production (canary first)
kubectl apply -f k8s/production/ -n production
# Canary: 10% traffic for 15 minutes
# If error rate < 1%, proceed to full rollout

# 5. Full rollout
kubectl rollout resume deployment/core-api -n production
```

**Rollback:**
```bash
kubectl rollout undo deployment/core-api -n production
```
Maximum rollback time target: 5 minutes

### Environment URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production | https://api.novacorp.io | Live traffic |
| Staging | https://staging-api.novacorp.io | Pre-prod testing |
| Development | https://dev-api.novacorp.io | Daily dev builds |
| QA | https://qa-api.novacorp.io | QA team testing |

---

## 6. Meeting Notes Archive

### 2026-03-10 - Architecture Review Board

**Attendees:** Marcus, Priya, James, Elena, + 8 others
**Topic:** Proposal to migrate from PostgreSQL to CockroachDB

**Discussion:**
- Priya presented scaling challenges with current PostgreSQL setup
- Read replicas are at capacity during peak hours
- CockroachDB would provide horizontal scaling without application changes
- James raised concerns about security audit implications for SOC 2
- Decision: **DEFERRED** - Will revisit in Q2 after SOC 2 certification complete
- Action: Tomasz to prepare a proof-of-concept with CockroachDB on staging

**Cost Estimate:**
- CockroachDB Cloud: $2,400/month (vs current PostgreSQL RDS: $1,800/month)
- Migration effort: ~3 sprints (6 weeks)

### 2026-03-03 - Security Review

**Attendees:** James, Sarah, Dmitri, Fatima, Marcus
**Topic:** Q1 Security Assessment

**Findings:**
- 3 critical vulns found in auth-service (all patched as of 2026-02-28)
- DAST scanning deployed to 8 of 10 services (missing: billing, ml-pipeline)
- SOC 2 auditor scheduled for March 20-24
- Sarah discovered XSS vulnerability in admin dashboard search field (VULN-2026-047)
  - Patched same day
  - Root cause: Missing input sanitization in React component
  - Tracking in Jira: SEC-1892

### 2026-02-24 - Sprint Retro (Team Nimbus)

**Attendees:** Priya, Aisha, Tomasz, Lin, Roberto, Yuki
**Topic:** Sprint 2026-S04 Retrospective

**What went well:**
- Kafka migration completed ahead of schedule (Tomasz)
- New monitoring dashboards are catching issues faster (Roberto)

**What didn't go well:**
- API Gateway upgrade caused 45 minutes of downtime on Feb 19
  - Root cause: Config incompatibility between Kong 3.3 and 3.4
  - Roberto's post-mortem: https://docs.novacorp.io/post-mortems/2026-02-19
- Yuki's onboarding documentation PR has been in review for 2 weeks

**Action Items:**
- Priya to establish 48-hour SLA for PR reviews
- Roberto to add Kong version compatibility check to CI pipeline

### 2026-02-10 - All-Hands Engineering

**Attendees:** All engineering (~35 people)
**Topic:** Q1 Goals and New Hires

**Announcements:**
- NovaCorp raised Series B: $45M at $300M valuation
- Hiring plan: 12 new engineers by June
- New office in Austin, TX opening April 1
- Company-wide hackathon scheduled for March 15-16

**Key Metrics Shared:**
- MAU: 125,000 (up 40% from Q4 2025)
- API requests/day: 8.2 million
- Uptime: 99.92% (target: 99.95%)
- MTTR: 22 minutes (improved from 45 minutes in Q3 2025)

### 2026-01-27 - Data Team Sync

**Attendees:** analytics-service owners, ML team
**Topic:** Data pipeline performance

**Notes:**
- ETL job run time has increased from 45 min to 2.5 hours over the past month
- Root cause: New event tracking added 3x more data volume
- Proposed solution: Switch from batch to streaming using Kafka Streams
- Tomasz volunteered to help with Kafka integration
- Budget approved for Snowflake migration ($3,200/month)

---

## 7. Onboarding Checklist

### Week 1 - New Engineer Setup

- [ ] Get MacBook Pro from IT (ticket to it-support@novacorp.io)
- [ ] Set up 1Password account (invite from team lead)
- [ ] Configure GitHub access (org: NovaCorp-Engineering)
- [ ] Set up AWS IAM credentials (request via #devops Slack channel)
- [ ] Install required tools:
  - Docker Desktop 4.x
  - kubectl v1.29+
  - Helm v3.14+
  - Node.js 20 LTS
  - Go 1.22+
  - Python 3.12+
- [ ] Clone all team repos
- [ ] Complete security training (mandatory, due within 5 business days)
- [ ] Schedule 1:1s with team lead and skip-level manager

### Week 2 - First Contribution

- [ ] Fix a "good first issue" bug
- [ ] Submit first PR and get it merged
- [ ] Shadow an on-call rotation
- [ ] Attend sprint planning and retro

### Access Levels by Role

| Resource | Junior | Mid | Senior | Lead |
|----------|--------|-----|--------|------|
| Production DB (read) | No | Yes | Yes | Yes |
| Production DB (write) | No | No | Yes | Yes |
| AWS Console | Read-only | Read-only | Full | Full |
| Deploy to staging | Yes | Yes | Yes | Yes |
| Deploy to production | No | No | Yes | Yes |
| PagerDuty on-call | No | Yes | Yes | Yes |

---

## 8. Third-Party Integrations

### Active Integrations

| Service | Purpose | Owner | API Key Location | Monthly Cost |
|---------|---------|-------|-----------------|--------------|
| Stripe | Payments | Revenue Team | AWS Secrets Manager: `prod/stripe/api_key` | ~$2,100 (fees) |
| SendGrid | Email | Platform | AWS Secrets Manager: `prod/sendgrid/api_key` | $89.95 |
| Twilio | SMS/MFA | Platform | AWS Secrets Manager: `prod/twilio/auth_token` | ~$340 |
| Datadog | Monitoring | SRE | Environment variable: `DD_API_KEY` | $1,200 |
| PagerDuty | Alerting | SRE | Environment variable: `PAGERDUTY_TOKEN` | $420 |
| Snyk | Security Scanning | Security | GitHub App integration | $450 |
| Sentry | Error Tracking | Platform | DSN in app config | $312 |
| LaunchDarkly | Feature Flags | Platform | SDK key in app config | $275 |

### Deprecated Integrations

- **Mailchimp** (replaced by SendGrid, Jan 2026)
- **New Relic** (replaced by Datadog, Nov 2025)
- **Bugsnag** (replaced by Sentry, Aug 2025)

---

## 9. Security Policies

### API Rate Limiting

**Current Policy (Updated 2026-03-01):**

| Tier | Rate Limit | Burst | Monthly Cost |
|------|-----------|-------|-------------|
| Free | 60 req/min | 10 | $0 |
| Standard | 100 req/min | 20 | $49/month |
| Professional | 300 req/min | 50 | $199/month |
| Enterprise | 1,000 req/min | 200 | Custom |

> **IMPORTANT:** The database schema still shows the old default of 100 req/min for standard
> and 500 req/min for enterprise. The actual enforced limits are as shown above (updated
> March 1, 2026 per decision SEC-2026-014). The schema default has not been updated yet
> to avoid a migration during SOC 2 audit prep. It will be updated in Q2 2026.

### Password Policy

- Minimum 12 characters
- Must contain: uppercase, lowercase, number, special character
- Password history: last 10 passwords blocked
- Account lockout: 5 failed attempts, 30-minute lockout
- MFA required for: admin, superadmin roles
- MFA optional but encouraged for: user role

### Secret Management

- All secrets stored in AWS Secrets Manager
- Rotation schedule:
  - Database credentials: Every 90 days (automated)
  - API keys (internal): Every 180 days
  - Third-party API keys: Per vendor recommendation
  - SSH keys: Annually
- **NEVER** store secrets in:
  - Git repositories
  - Environment variables in Dockerfiles
  - Slack messages
  - Confluence/Wiki pages

### Vulnerability Disclosure

- Bug bounty program: https://hackerone.com/novacorp
- Scope: *.novacorp.io, mobile apps
- Minimum bounty: $100 (low), $500 (medium), $2,000 (high), $5,000 (critical)
- Response SLA: Triage within 24 hours, fix critical within 48 hours
- Contact: security@novacorp.io
- PGP key: 0x4A2B8C9D (fingerprint: 8F3A 2B1C 9D4E 5F6A 7B8C)

---

## 10. Internal Tools

### Monitoring Dashboards

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| API Health | https://grafana.internal/d/api-health | Request rates, error rates, latency |
| Database | https://grafana.internal/d/db-metrics | Connections, query performance |
| Kubernetes | https://grafana.internal/d/k8s-cluster | Pod health, resource usage |
| Business KPIs | https://grafana.internal/d/business | MAU, revenue, conversion |
| Security | https://grafana.internal/d/sec-overview | Vuln counts, scan results |

### CI/CD Pipeline

**Platform:** GitHub Actions
**Runners:** Self-hosted on AWS (c5.2xlarge instances)

**Standard Pipeline Stages:**
1. Lint and Format Check
2. Unit Tests
3. Integration Tests
4. Security Scan (Snyk + custom SAST)
5. Docker Build
6. Push to ECR
7. Deploy to Staging (automatic for `main`)
8. Deploy to Production (manual approval required)

**Average Pipeline Duration:** 12 minutes (target: under 10 minutes)

### Code Quality Gates

- Test coverage minimum: 80%
- No critical or high Snyk vulnerabilities
- No lint errors
- PR must have at least 2 approvals
- All CI checks must pass
- Branch must be up to date with `main`

### Feature Flag System

**Provider:** LaunchDarkly
**Naming Convention:** `team-name.feature-name` (e.g., `nimbus.new-search-ui`)

**Current Active Flags:**
- `nimbus.kafka-streaming` - Kafka-based event streaming (enabled: staging, disabled: production)
- `nimbus.new-search-ui` - Redesigned search interface (enabled: 20% of users in production)
- `aegis.enhanced-mfa` - TOTP + WebAuthn support (enabled: admin users only)
- `prism.dark-mode` - Dark mode UI (enabled: all users)
- `revenue.usage-billing` - Usage-based billing (enabled: staging only)
- `nimbus.cockroachdb` - CockroachDB read path (disabled everywhere - POC not started)

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| Canary Deploy | Deploy to small % of traffic before full rollout |
| Feature Flag | Toggle to enable/disable features without deploy |
| MTTR | Mean Time To Recovery |
| P99 | 99th percentile latency |
| SLA | Service Level Agreement |
| SLO | Service Level Objective |

## Appendix B: Emergency Contacts

**In case of P1 incident:**
1. Primary on-call (check PagerDuty schedule)
2. Roberto Diaz (SRE Lead): +1-555-0142
3. Priya Sharma (Platform Director): +91-98765-43210
4. Marcus Chen (VP Eng): +1-555-0199

**External:**
- AWS Support (Business tier): Case via console or call
- Cloudflare Support: support@cloudflare.com / Dashboard
- Stripe Emergency: +1-888-926-2289

## Appendix C: Cost Summary (Monthly)

| Category | Cost | Notes |
|----------|------|-------|
| AWS Infrastructure | $18,400 | EC2, RDS, EKS, S3, etc. |
| Third-Party SaaS | $5,187 | See Section 8 |
| Cloudflare Pro | $200 | CDN + WAF |
| GitHub Enterprise | $1,260 | 35 seats x $36 |
| 1Password Business | $280 | 35 seats x $8 |
| **Total** | **$25,327** | |

## Appendix D: On-Call Rotation (Q1 2026)

| Week | Primary | Secondary |
|------|---------|-----------|
| Jan 6-12 | Roberto Diaz | Aisha Patel |
| Jan 13-19 | Aisha Patel | Tomasz Kowalski |
| Jan 20-26 | Tomasz Kowalski | Roberto Diaz |
| Jan 27-Feb 2 | Roberto Diaz | Lin Wei |
| Feb 3-9 | Aisha Patel | Roberto Diaz |
| Feb 10-16 | Tomasz Kowalski | Aisha Patel |
| Feb 17-23 | Roberto Diaz | Tomasz Kowalski |
| Feb 24-Mar 2 | Aisha Patel | Roberto Diaz |
| Mar 3-9 | Tomasz Kowalski | Lin Wei |
| Mar 10-16 | Roberto Diaz | Aisha Patel |
| Mar 17-23 | Aisha Patel | Tomasz Kowalski |
| Mar 24-30 | Tomasz Kowalski | Roberto Diaz |

**Notes:**
- Lin Wei is secondary only (not primary eligible until completing on-call training)
- Yuki Tanaka is exempt from on-call (junior engineer policy)
- Swap requests must be submitted 48 hours in advance via PagerDuty
