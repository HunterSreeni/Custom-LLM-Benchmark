# Error Reports - Incident INC-20260403-042

## Report 1: Frontend Team (Filed 14:35 UTC)

**Reporter:** Sarah Chen, Senior Frontend Engineer
**Component:** Checkout UI (React SPA)
**Severity:** P1

**Description:**
Starting at approximately 14:15 UTC, users began reporting that the checkout page shows a "Something went wrong" error after clicking "Place Order." Our error tracking (Sentry) shows a spike in `HTTP 500` responses from the `/api/v2/checkout` endpoint.

**What we've checked:**
- Frontend code has not been deployed since yesterday (v3.12.1)
- Browser console shows `POST /api/v2/checkout` returning 500 with body: `{"error":"internal_server_error","message":"upstream service unavailable"}`
- Affects all browsers, all regions
- Error rate: ~60% of checkout attempts failing
- No changes to our CDN or static assets

**Timeline:**
- 14:00 - Normal operations, ~2% error rate (baseline)
- 14:15 - Error rate jumps to 35%
- 14:25 - Error rate reaches 60%
- 14:35 - This report filed

---

## Report 2: API Team (Filed 14:38 UTC)

**Reporter:** Marcus Johnson, Backend Engineer
**Component:** API Gateway / Checkout API
**Severity:** P1

**Description:**
Our API gateway is returning 500 errors on checkout endpoints because the downstream Payment Service is timing out. The gateway has a 10-second timeout for payment calls, and we're seeing 100% of payment requests exceeding this.

**What we've checked:**
- API gateway pods are healthy (CPU <30%, memory <50%)
- All other endpoints (product catalog, user auth, cart) are working normally
- Only payment-related endpoints affected
- Payment Service health check endpoint `/health` returns 200, but actual payment processing hangs
- No recent deployments to the API gateway

**Metrics:**
- Payment Service p50 latency: 12.3s (normal: 0.8s)
- Payment Service p99 latency: 28.7s (normal: 2.1s)
- Payment Service error rate: 0% (requests don't error - they just hang)

---

## Report 3: Payment Team (Filed 14:42 UTC)

**Reporter:** Aisha Patel, Payment Systems Engineer
**Component:** Payment Service (Go microservice)
**Severity:** P1

**Description:**
Our Payment Service's connection pool to the Stripe API is completely exhausted. We use an HTTP connection pool with max 100 connections. All 100 are currently in use and not being returned.

**What we've checked:**
- No code changes to Payment Service since last week
- Stripe status page shows all systems operational
- Our connection pool metrics show connections are being acquired but never released
- Each connection appears to be stuck waiting on DNS resolution for `api.stripe.com`
- Normal DNS resolution time: 1-5ms
- Current DNS resolution time: 8-15 seconds
- Goroutine dump shows all 100 pool connections blocked in `net.(*Resolver).lookupHost`

**Connection Pool Timeline:**
- 14:00 - Pool utilization: 15/100
- 14:05 - Pool utilization: 40/100
- 14:10 - Pool utilization: 85/100
- 14:12 - Pool utilization: 100/100 (exhausted)
- 14:12+ - All new payment requests queued, waiting for connections

---

## Report 4: Infrastructure Team (Filed 14:48 UTC)

**Reporter:** David Kim, SRE
**Component:** DNS Infrastructure
**Severity:** P1

**Description:**
We're seeing dramatically increased DNS resolution latency across all services in the us-east-1 region. Our internal DNS resolver (CoreDNS) is reporting slow responses from its upstream forwarders.

**What we've checked:**
- CoreDNS pods are healthy and not resource-constrained
- Internal DNS resolution (*.internal domains) works normally (<1ms)
- External DNS resolution (*.com, *.io, etc.) is severely degraded
- CoreDNS cache hit rate dropped from 95% to 12% at 13:58 UTC
- CoreDNS upstream forwarder is configured to use our cloud provider's DNS (169.254.169.253) as primary and CloudResolve DNS (198.51.100.10, 198.51.100.11) as secondary
- Cloud provider DNS is responding normally
- CloudResolve DNS is showing intermittent failures

**DNS Latency (external domains):**
- 13:55 - p50: 2ms, p99: 15ms (normal)
- 14:00 - p50: 45ms, p99: 2,500ms
- 14:10 - p50: 800ms, p99: 12,000ms
- 14:20 - p50: 3,200ms, p99: 15,000ms (timeout)

**Configuration note:**
We recently changed our CoreDNS forwarding policy from `policy: random` to `policy: sequential` as part of a cost-optimization effort (to prefer the cloud provider's free DNS over CloudResolve's paid tier). However, when the primary fails, the sequential policy adds the full timeout delay (5s) before trying the secondary.

---

## Report 5: Network Team (Filed 14:55 UTC)

**Reporter:** Lisa Wang, Network Engineer
**Component:** External DNS Dependencies
**Severity:** P1

**Description:**
Our cloud provider's DNS resolver (169.254.169.253) experienced a partial outage beginning at approximately 13:55 UTC. The resolver is intermittently failing to resolve external domains, returning SERVFAIL for approximately 40% of queries.

**What we've confirmed:**
- Cloud provider has acknowledged the issue on their status page (posted at 14:30 UTC)
- The outage affects DNS resolution for external domains only
- Internal/private DNS zones are unaffected
- The issue is isolated to the us-east-1a and us-east-1b availability zones
- Our infrastructure runs primarily in us-east-1a

**Impact chain (as we understand it):**
- Cloud DNS partial outage -> 40% of external DNS queries fail
- CoreDNS sequential policy means failed queries wait 5s timeout before trying secondary
- Even successful queries through the degraded resolver are slow (2-8s vs normal <5ms)
- Downstream services that make external API calls (Stripe, SendGrid, etc.) are affected
- Connection pools fill up because connections are held longer waiting for DNS

**Cloud provider ETA for fix:** 15:30 UTC

**Our mitigation options:**
1. Switch CoreDNS to `policy: random` to distribute across both resolvers
2. Temporarily remove cloud DNS from forwarders and use only CloudResolve
3. Increase connection pool sizes as a band-aid (not recommended - masks the problem)
