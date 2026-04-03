# Failed Deployment Scenario - Nexus Platform v2.5.0

## Timeline

**14:00 UTC** - Deployment of v2.5.0 begins via automated CI/CD pipeline
- Changes include: new billing module, database migration (adds 3 tables, modifies 2), updated authentication flow, new API endpoints

**14:05 UTC** - Docker image built and pushed to registry. Kubernetes rolling update started.
- Old pods: 4x v2.4.1
- New pods: rolling out v2.5.0 (1 at a time, maxUnavailable: 0, maxSurge: 1)

**14:08 UTC** - First v2.5.0 pod passes readiness check and begins receiving traffic
- Database migration has already run (forward-only, no down migration written)

**14:12 UTC** - Monitoring shows error rate spike: 5xx errors jump from 0.1% to 12%
- Errors are `500 Internal Server Error` on `/api/billing/subscription` endpoint
- Sentry reports: `TypeError: Cannot read property 'plan_tier' of undefined`
- The new billing code expects a `plan_tier` column that was added by migration, but the code references `subscription.plan_tier` while the migration named the column `tier_level`

**14:15 UTC** - Second v2.5.0 pod rolls out. Error rate climbs to 18%.
- Mixed fleet: 2x v2.5.0 (broken billing), 2x v2.4.1 (working)
- v2.4.1 pods are unaffected because they don't use the new billing endpoints

**14:18 UTC** - Alert fires: "APIErrorRate above 15% for 5 minutes"
- On-call engineer is paged

**14:20 UTC** - Engineer investigates. Confirms billing endpoint is broken in v2.5.0.
- Non-billing endpoints work fine on both versions
- 3 customers have reported failed subscription upgrades
- 1 customer was charged via Stripe webhook but the local DB was not updated (inconsistency)

**14:25 UTC** - Decision point: rollback needed

## Current State

- **Running pods:** 2x v2.5.0, 2x v2.4.1
- **Database state:** Migration has run - new tables exist, `tier_level` column exists (v2.5.0 code expects `plan_tier`)
- **Stripe state:** 1 customer charged $49.99 but local subscription record not updated
- **Cache (Redis):** Contains mixed data from both versions - some billing cache entries use new schema
- **CDN:** New frontend assets (v2.5.0) cached at edge with 1-hour TTL
- **Dependencies:** No other services depend on the new billing endpoints (they are additive)

## Constraints

- Database migration cannot be trivially reversed (no down migration was written)
- The old v2.4.1 code does not read from the new tables/columns, so it is unaffected by the migration
- Stripe charges are real money - customer impact must be resolved
- Zero-downtime requirement - cannot take the API fully offline
- SLA: 99.9% uptime - already lost ~15 minutes of degraded service

## Your Task

Create a detailed rollback plan addressing:
1. Immediate actions to stop the bleeding
2. How to roll back the Kubernetes deployment
3. Database strategy (the migration already ran)
4. Stripe/payment inconsistency resolution
5. Cache invalidation approach
6. CDN cache handling
7. Communication plan (internal and customer-facing)
8. Post-incident items to prevent recurrence
