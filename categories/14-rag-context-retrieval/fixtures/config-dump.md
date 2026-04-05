# NovaCorp - Production Configuration Dump
# Exported: 2026-03-15T14:30:00Z
# Source: AWS Parameter Store + Environment Variables
# WARNING: This is a point-in-time snapshot. Some values may be outdated.

---

## Application Configuration (core-api)

```yaml
# config/production.yml
server:
  port: 3000
  host: "0.0.0.0"
  graceful_shutdown_timeout: 30s
  max_request_size: "10mb"
  cors:
    origins:
      - "https://app.novacorp.io"
      - "https://admin.novacorp.io"
      - "https://staging-app.novacorp.io"
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    credentials: true

database:
  primary:
    host: "db-primary.internal"
    port: 5432
    database: "novacorp_prod"
    username: "app_core"
    # password: fetched from AWS Secrets Manager at runtime
    pool_size: 40          # Increased from 20 on 2026-02-14 (INC-001)
    idle_timeout: 300000   # 5 minutes in ms
    connection_timeout: 5000
    ssl: true
    ssl_mode: "verify-full"
  read_replica:
    host: "db-replica-01.internal"
    port: 5432
    database: "novacorp_prod"
    username: "app_core_readonly"
    pool_size: 30
    # NOTE: read_replica_02 decommissioned on 2026-01-15
    # It was at db-replica-02.internal but had persistent replication lag

cache:
  redis:
    host: "cache-01.internal"
    port: 6379
    # Database assignments:
    #   db 0 = sessions (DO NOT FLUSH)
    #   db 1 = application cache (safe to flush)
    #   db 2 = rate limiting data (DO NOT FLUSH)
    #   db 3 = feature flag cache (auto-expires)
    max_retries: 3
    retry_delay: 100
    connect_timeout: 5000
    # Failover host (cold standby)
    failover_host: "cache-02.internal"
    failover_port: 6379

search:
  elasticsearch:
    nodes:
      - "https://es-node-01.internal:9200"
      - "https://es-node-02.internal:9200"
      - "https://es-node-03.internal:9200"
    index_prefix: "novacorp_prod"
    max_results: 10000
    request_timeout: 30000
    # Upgraded from ES 7.17 to ES 8.12 on 2025-11-20
```

---

## Environment Variables (Production)

```bash
# === Application ===
NODE_ENV=production
APP_VERSION=2.14.0
LOG_LEVEL=info
# LOG_LEVEL was changed from 'debug' to 'info' on 2026-03-01
# to reduce CloudWatch costs ($340/month savings)

# === Authentication ===
JWT_SECRET=<fetched-from-secrets-manager>
JWT_ISSUER=https://auth.novacorp.io
JWT_EXPIRY=3600          # 1 hour in seconds
REFRESH_TOKEN_EXPIRY=2592000  # 30 days in seconds
BCRYPT_ROUNDS=12
# Note: BCRYPT_ROUNDS was 10 before 2026-01-08 security audit recommendation

# === OAuth Providers ===
GOOGLE_CLIENT_ID=847291035642-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<fetched-from-secrets-manager>
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=<fetched-from-secrets-manager>

# === Feature Flags ===
LAUNCHDARKLY_SDK_KEY=sdk-prod-a1b2c3d4-e5f6-7890-abcd-ef1234567890
LAUNCHDARKLY_ENVIRONMENT=production
# Feature flag evaluation timeout: 500ms
# If LD is unreachable, defaults are used (all flags OFF except prism.dark-mode)

# === Monitoring ===
DD_API_KEY=<fetched-from-secrets-manager>
DD_APP_KEY=<fetched-from-secrets-manager>
DD_SITE=datadoghq.com
DD_SERVICE=core-api
DD_ENV=production
DD_VERSION=2.14.0
SENTRY_DSN=https://abc123@o456789.ingest.sentry.io/1234567
SENTRY_TRACES_SAMPLE_RATE=0.1    # 10% of transactions
# Reduced from 0.5 to 0.1 on 2026-02-01 to cut Sentry costs

# === Email (SendGrid) ===
SENDGRID_API_KEY=<fetched-from-secrets-manager>
SENDGRID_FROM_EMAIL=noreply@novacorp.io
SENDGRID_FROM_NAME="NovaCorp"
# Templates:
#   d-abc123 = Welcome email
#   d-def456 = Password reset
#   d-ghi789 = Invoice
#   d-jkl012 = MFA setup confirmation
# Daily send limit: 50,000 (SendGrid Pro plan)

# === Payments (Stripe) ===
STRIPE_PUBLISHABLE_KEY=pk_live_51abc...xyz
STRIPE_SECRET_KEY=<fetched-from-secrets-manager>
STRIPE_WEBHOOK_SECRET=<fetched-from-secrets-manager>
STRIPE_API_VERSION=2024-12-18.acacia
# Webhook endpoint: https://api.novacorp.io/webhooks/stripe
# Events subscribed: invoice.paid, customer.subscription.updated, payment_intent.failed

# === SMS/MFA (Twilio) ===
TWILIO_ACCOUNT_SID=AC1234567890abcdef
TWILIO_AUTH_TOKEN=<fetched-from-secrets-manager>
TWILIO_FROM_NUMBER=+15551234567
TWILIO_VERIFY_SERVICE_SID=VA0987654321fedcba
# Monthly SMS budget cap: $500

# === Storage (AWS S3) ===
AWS_REGION=us-east-1
S3_BUCKET_UPLOADS=novacorp-prod-uploads
S3_BUCKET_BACKUPS=novacorp-prod-backups
S3_BUCKET_STATIC=novacorp-prod-static
# Upload size limit: 50MB per file
# Backup retention: 90 days (lifecycle policy)
# Static assets served via CloudFront distribution: E1ABC2DEF3GHIJ

# === Kafka ===
KAFKA_BROKERS=kafka-01.internal:9092,kafka-02.internal:9092,kafka-03.internal:9092
KAFKA_CLIENT_ID=core-api-prod
KAFKA_GROUP_ID=core-api-consumers
KAFKA_SASL_USERNAME=core-api
KAFKA_SASL_PASSWORD=<fetched-from-secrets-manager>
# Topics:
#   novacorp.events.user    - User activity events
#   novacorp.events.billing - Billing/payment events
#   novacorp.events.audit   - Audit trail events
#   novacorp.events.dlq     - Dead letter queue
# Message retention: 7 days
# Max message size: 1MB (messages over 1MB silently dropped - fix in PR #1952)

# === Rate Limiting ===
RATE_LIMIT_ENABLED=true
RATE_LIMIT_STORE=redis
RATE_LIMIT_REDIS_DB=2
# DEPRECATED CONFIG (still in env but NOT used since March 1, 2026):
# RATE_LIMIT_DEFAULT=100
# RATE_LIMIT_ENTERPRISE=500
# New rate limits are managed via database table `rate_limit_tiers`
# See security policy section in brain.md for current values

# === Deprecated Variables (to be removed Q2 2026) ===
# NEW_RELIC_LICENSE_KEY=<removed>   # Replaced by Datadog Nov 2025
# BUGSNAG_API_KEY=<removed>         # Replaced by Sentry Aug 2025
# MAILCHIMP_API_KEY=<removed>       # Replaced by SendGrid Jan 2026
# V1_API_ENABLED=true               # v1 endpoints still active, removal July 1 2026
```

---

## Kubernetes Configuration (Production)

```yaml
# k8s/production/core-api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: core-api
  namespace: production
  labels:
    app: core-api
    version: v2.14.0
    team: nimbus
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: core-api
  template:
    metadata:
      labels:
        app: core-api
        version: v2.14.0
    spec:
      containers:
        - name: core-api
          image: 123456789.dkr.ecr.us-east-1.amazonaws.com/core-api:v2.14.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3000"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: core-api-secrets
                  key: database-url
---
# HPA Configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: core-api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: core-api
  minReplicas: 4
  maxReplicas: 12
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## Nginx / Kong Gateway Configuration

```yaml
# kong/production.yml
_format_version: "3.0"

services:
  - name: core-api
    url: http://core-api.production.svc.cluster.local:3000
    routes:
      - name: api-v2
        paths:
          - /api/v2
        strip_path: false
      - name: api-v1-deprecated
        paths:
          - /api/v1
        strip_path: false
        # V1 routes still active - removal scheduled July 1, 2026
    plugins:
      - name: rate-limiting
        config:
          # NOTE: These Kong-level rate limits are a FALLBACK only.
          # Primary rate limiting is done at application level via Redis (db 2).
          # Kong limits are 2x the app limits as a safety net.
          minute: 200        # 2x standard tier (100/min)
          policy: redis
          redis_host: cache-01.internal
          redis_port: 6379
          redis_database: 2
      - name: cors
        config:
          origins:
            - "https://app.novacorp.io"
            - "https://admin.novacorp.io"
      - name: jwt
        config:
          key_claim_name: "kid"
          claims_to_verify:
            - exp
          # JWT validation fixed during Kong 3.4 upgrade (Feb 10 deploy)
          # See daily log entry for February 10, 2026
      - name: request-size-limiting
        config:
          allowed_payload_size: 10
          size_unit: megabytes

  - name: auth-service
    url: http://auth-service.production.svc.cluster.local:3001
    routes:
      - name: auth
        paths:
          - /auth
        strip_path: false

  - name: search-service
    url: http://search-service.production.svc.cluster.local:3002
    routes:
      - name: search
        paths:
          - /api/v2/search
        strip_path: false
```

---

## Database Backup Configuration

```yaml
# backup/config.yml
schedule:
  full_backup: "0 2 * * 0"    # Every Sunday at 2 AM UTC
  incremental: "0 2 * * 1-6"  # Mon-Sat at 2 AM UTC
  wal_archiving: continuous    # Continuous WAL archiving to S3

retention:
  full_backups: 4              # Keep last 4 weekly backups
  incremental: 7               # Keep 7 daily incrementals
  wal_archives: 30             # 30 days of WAL archives
  # Total estimated storage: ~120GB per month

destination:
  bucket: novacorp-prod-backups
  prefix: "postgres/"
  encryption: AES-256
  # Cross-region replica: novacorp-prod-backups-dr (us-west-2)

verification:
  restore_test: "0 4 * * 0"   # Test restore every Sunday at 4 AM UTC
  alert_on_failure: true
  notification_channel: "#dba-alerts"

# Last successful restore test: 2026-03-30T04:15:00Z
# Restore time: 18 minutes (target: under 30 minutes)
```

---

## CI/CD Configuration

```yaml
# .github/workflows/deploy.yml (simplified)
name: Deploy Pipeline
on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  ECR_REGISTRY: 123456789.dkr.ecr.us-east-1.amazonaws.com
  EKS_CLUSTER: novacorp-prod

jobs:
  test:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run test -- --coverage
      # Coverage threshold: 80% (enforced)
      - run: npm run test:integration
    timeout-minutes: 15

  security:
    runs-on: self-hosted
    needs: test
    steps:
      - uses: snyk/actions/node@master
        with:
          args: --severity-threshold=high
      - run: npm run sast
    timeout-minutes: 10

  build:
    runs-on: self-hosted
    needs: [test, security]
    steps:
      - run: docker build -t $ECR_REGISTRY/core-api:${{ github.sha }} .
      - run: docker push $ECR_REGISTRY/core-api:${{ github.sha }}
    timeout-minutes: 10

  deploy-staging:
    runs-on: self-hosted
    needs: build
    environment: staging
    steps:
      - run: kubectl set image deployment/core-api core-api=$ECR_REGISTRY/core-api:${{ github.sha }} -n staging
      - run: ./scripts/smoke-test.sh staging
    timeout-minutes: 10

  deploy-production:
    runs-on: self-hosted
    needs: deploy-staging
    environment: production
    # Manual approval required
    steps:
      - run: kubectl set image deployment/core-api core-api=$ECR_REGISTRY/core-api:${{ github.sha }} -n production
      - run: ./scripts/smoke-test.sh production
    timeout-minutes: 15
```

---

## Feature Flag Configuration (LaunchDarkly Export)

```json
{
  "flags": {
    "nimbus.kafka-streaming": {
      "key": "nimbus.kafka-streaming",
      "description": "Enable Kafka-based event streaming pipeline",
      "variations": [true, false],
      "targeting": {
        "production": { "enabled": false, "default": false },
        "staging": { "enabled": true, "default": true }
      },
      "created": "2026-02-01",
      "owner": "tomasz.kowalski@novacorp.io",
      "tags": ["nimbus", "infrastructure"]
    },
    "nimbus.new-search-ui": {
      "key": "nimbus.new-search-ui",
      "description": "Redesigned search interface with improved relevance",
      "variations": [true, false],
      "targeting": {
        "production": { "enabled": true, "percentage": 50, "default": false },
        "staging": { "enabled": true, "default": true }
      },
      "created": "2026-01-15",
      "owner": "lin.wei@novacorp.io",
      "tags": ["nimbus", "frontend", "experiment"]
    },
    "aegis.enhanced-mfa": {
      "key": "aegis.enhanced-mfa",
      "description": "TOTP + WebAuthn/FIDO2 support for MFA",
      "variations": [true, false],
      "targeting": {
        "production": { "enabled": true, "rules": [{ "attribute": "role", "op": "in", "values": ["admin", "superadmin"] }], "default": false },
        "staging": { "enabled": true, "default": true }
      },
      "created": "2026-02-20",
      "owner": "aisha.patel@novacorp.io",
      "tags": ["aegis", "security"]
    },
    "prism.dark-mode": {
      "key": "prism.dark-mode",
      "description": "Dark mode UI theme",
      "variations": [true, false],
      "targeting": {
        "production": { "enabled": true, "default": true },
        "staging": { "enabled": true, "default": true }
      },
      "created": "2025-11-01",
      "owner": "jake.morrison@novacorp.io",
      "tags": ["prism", "ui"]
    },
    "revenue.usage-billing": {
      "key": "revenue.usage-billing",
      "description": "Usage-based billing model",
      "variations": [true, false],
      "targeting": {
        "production": { "enabled": false, "default": false },
        "staging": { "enabled": true, "default": true }
      },
      "created": "2026-03-01",
      "owner": "billing-team@novacorp.io",
      "tags": ["revenue", "billing"]
    },
    "nimbus.cockroachdb": {
      "key": "nimbus.cockroachdb",
      "description": "Route read queries through CockroachDB",
      "variations": [true, false],
      "targeting": {
        "production": { "enabled": false, "default": false },
        "staging": { "enabled": false, "default": false }
      },
      "created": "2026-03-10",
      "owner": "tomasz.kowalski@novacorp.io",
      "tags": ["nimbus", "database", "experiment"]
    }
  },
  "exported_at": "2026-03-15T14:30:00Z"
}
```

---

## Notes

- Config last audited: 2026-03-15 by Roberto Diaz
- Next audit scheduled: 2026-06-15
- To request config changes: File ticket in Jira project INFRA
- Emergency config changes: Contact on-call SRE via PagerDuty
