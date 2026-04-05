# NovaCorp Engineering - Daily Standup Logs
## February - March 2026

---

### Monday, February 2, 2026

**Team Nimbus Standup (10:00 AM IST)**

**Priya:** Sprint 2026-S03 kickoff. Focus this sprint: API Gateway upgrade to Kong 3.4 and Kafka event pipeline Phase 2.

**Aisha:**
- Yesterday: Finished OAuth token refresh bug fix (PR #1847)
- Today: Starting Kong 3.4 config migration
- Blockers: None

**Tomasz:**
- Yesterday: Kafka consumer group rebalancing research
- Today: Implementing dead letter queue for failed events
- Blockers: Need access to staging Kafka cluster (requested from Roberto)

**Lin:**
- Yesterday: Dashboard performance audit - found 3 slow React components
- Today: Implementing React.memo and virtualized lists for user table
- Blockers: None

**Roberto:**
- Yesterday: Set up new Grafana dashboards for Kafka metrics
- Today: Granting Tomasz staging Kafka access, updating RBAC policies
- Blockers: None

**Yuki:**
- Yesterday: Continued onboarding docs update
- Today: Writing API documentation for v2 endpoints
- Blockers: PR #1832 still needs review (been open 5 days)

---

### Tuesday, February 3, 2026

**Team Nimbus Standup**

**Aisha:**
- Yesterday: Kong 3.4 config migration - 60% complete
- Today: Finishing config migration, running compatibility tests
- Blockers: Found 3 deprecated plugins that need replacement

**Tomasz:**
- Yesterday: Dead letter queue implemented and tested locally
- Today: Deploying DLQ to staging, writing integration tests
- Blockers: None (Roberto granted access)

**Lin:**
- Yesterday: React.memo optimization done - user table renders 4x faster
- Today: Working on search results page performance
- Blockers: None

**Roberto:**
- Yesterday: RBAC policies updated, Kafka access granted
- Today: Setting up alerts for Kafka consumer lag
- Blockers: None

**Yuki:**
- Yesterday: API docs for /users and /search endpoints complete
- Today: Documenting /webhooks and /analytics endpoints
- Blockers: PR #1832 still in review - Priya to address

**Priya:** I'll review PR #1832 today. Also, deploy window tomorrow - Aisha, will Kong be ready?
**Aisha:** Not for tomorrow. Thursday at the earliest.

---

### Wednesday, February 4, 2026

**Team Nimbus Standup**

**Aisha:**
- Yesterday: Replaced 3 deprecated Kong plugins (rate-limiting-advanced, jwt-signer, request-validator)
- Today: Final compatibility testing in dev environment
- Blockers: Need James to review security implications of new rate-limiting plugin

**Tomasz:**
- Yesterday: DLQ deployed to staging, 12 integration tests passing
- Today: Load testing Kafka pipeline - target: 10,000 events/sec
- Blockers: None

**Lin:**
- Yesterday: Search page optimization complete - 60% faster rendering
- Today: Starting work on notification center redesign (PRISM-234)
- Blockers: Waiting for Arjun's Figma designs

**Roberto:**
- Yesterday: Kafka consumer lag alerts configured, tested with synthetic load
- Today: Writing runbook for Kafka-related incidents
- Blockers: None

**Yuki:**
- Yesterday: Webhook and analytics API docs complete
- Today: PR #1832 finally merged! Starting on developer quickstart guide
- Blockers: None

---

### Thursday, February 5, 2026

**Team Nimbus Standup**

**Aisha:**
- Yesterday: All compatibility tests passing. James approved security review.
- Today: Deploying Kong 3.4 to staging
- Blockers: None

**Tomasz:**
- Yesterday: Load test results: Kafka pipeline handles 15,200 events/sec (target was 10,000)
- Today: Writing capacity planning doc for Kafka
- Blockers: None

---

### Friday, February 6, 2026

**Team Nimbus Standup**

**Aisha:**
- Yesterday: Kong 3.4 deployed to staging, smoke tests passing
- Today: Monitoring staging for 24 hours before prod deploy request
- Blockers: None

**Tomasz:**
- Yesterday: Capacity planning doc complete, shared with Priya
- Today: Sprint work done early - picking up NIMBUS-567 (Redis connection pooling)
- Blockers: None

---

### Monday, February 9, 2026

**Team Nimbus Standup**

**Priya:** Kong staging has been stable over the weekend. Let's target Tuesday deploy window for production.

**Aisha:**
- Today: Preparing production deploy checklist for Kong 3.4
- Blockers: None

**Roberto:**
- Today: Pre-deploy checklist review, ensuring rollback procedure is documented
- Blockers: None

---

### Tuesday, February 10, 2026

**Team Nimbus Standup**

**Priya:** Deploy day. Roberto joined the team today - welcome!

**Roberto (new):**
- First day! Setting up dev environment.
- Will shadow Aisha on today's Kong deploy.

**Aisha:**
- Today: Production deploy of Kong 3.4 at 2:00 PM UTC
- Deployment ticket: DEPLOY-2026-012
- Blockers: None

**DEPLOY LOG - 2:00 PM UTC:**
- 2:00 PM: Deploy started
- 2:05 PM: Canary at 10% traffic
- 2:08 PM: Error rate spike to 3.2% on canary pods
- 2:10 PM: Investigated - found config mismatch in JWT validation
- 2:15 PM: Rolled back canary
- 2:30 PM: Fixed JWT config, redeployed canary
- 2:35 PM: Canary stable at 10%, error rate 0.1%
- 2:50 PM: Promoted to 50%
- 3:05 PM: Full rollout complete
- 3:20 PM: All health checks green, deploy successful

---

### Wednesday, February 11, 2026

**Team Nimbus Standup**

**Priya:** Kong 3.4 is stable in production. Great work Aisha and Roberto.

**Aisha:**
- Yesterday: Kong 3.4 successfully deployed (with brief canary rollback - see deploy log)
- Today: Writing post-deploy report, documenting JWT config fix
- Blockers: None

**Tomasz:**
- Yesterday: Redis connection pooling research
- Today: Implementing connection pool with pgBouncer pattern for Redis
- Blockers: None

---

### Thursday, February 12, 2026

**Team Nimbus Standup**

**Aisha:**
- Yesterday: Post-deploy report complete
- Today: Starting auth-service refactoring for WebAuthn support (SEC-1756)
- Blockers: Need Fatima's threat model document

**Tomasz:**
- Yesterday: Redis connection pool implementation - basic version working
- Today: Adding health checks and automatic reconnection logic
- Blockers: None

**Lin:**
- Yesterday: Notification center redesign - frontend scaffold complete
- Today: Integrating WebSocket connection for real-time notifications
- Blockers: Need notification-service WebSocket endpoint (Aisha to provide)

---

### Friday, February 13, 2026

**Team Nimbus Standup**

**Aisha:**
- Yesterday: WebAuthn support - FIDO2 registration flow implemented
- Today: FIDO2 authentication flow
- Blockers: Fatima's threat model expected Monday

**Lin:**
- Yesterday: WebSocket integration done - notifications arriving in real-time
- Today: Building notification preferences UI
- Blockers: None - Aisha provided the WebSocket endpoint spec

---

### Monday, February 16, 2026

**Team Nimbus Standup - Sprint 2026-S04 Kickoff**

**Priya:** Sprint S04 goals: Complete WebAuthn, launch notification center, start Kubernetes migration planning.

**Aisha:**
- Today: FIDO2 authentication flow complete, writing tests
- Blockers: Still waiting on Fatima's threat model (following up)

**Tomasz:**
- Today: Redis connection pool merged (PR #1892). Starting Kubernetes migration assessment.
- Blockers: None

**Roberto:**
- Today: Setting up Kubernetes staging cluster on EKS
- Blockers: Need AWS budget approval for additional EKS nodes ($800/month)

---

### Tuesday, February 17, 2026

**Team Nimbus Standup**

**Aisha:**
- Yesterday: WebAuthn tests complete - 94% coverage
- Today: PR #1901 ready for review (WebAuthn support)
- Blockers: None

**Roberto:**
- Yesterday: EKS staging cluster provisioned
- Today: Migrating auth-service to Kubernetes as pilot
- Blockers: AWS budget approved by Marcus

---

### Wednesday, February 18, 2026

**Team Nimbus Standup**

**Roberto:**
- Yesterday: Auth-service running on K8s staging
- Today: Setting up Kong ingress controller on K8s
- Blockers: Discovered incompatibility between Kong 3.4 and K8s ingress controller v2.12

**Aisha:**
- Yesterday: PR #1901 in review
- Today: Helping Roberto with Kong K8s compatibility
- Blockers: None

---

### Thursday, February 19, 2026

**INCIDENT REPORT**

**Time:** 11:23 AM UTC - 12:08 PM UTC (45 minutes downtime)
**Severity:** P1
**Impact:** API Gateway returning 502 errors for all traffic
**Root Cause:** Kong ingress controller update to v2.12 caused config sync failure with Kong 3.4
**Resolution:** Rolled back ingress controller to v2.11
**Post-mortem:** https://docs.novacorp.io/post-mortems/2026-02-19
**Action Items:**
1. Roberto: Add Kong version compatibility check to CI (due: Feb 28)
2. Aisha: Create staging test for ingress controller upgrades (due: Mar 7)
3. Priya: Update deploy checklist to include ingress controller version check

---

### Friday, February 20, 2026

**Team Nimbus Standup**

**Priya:** Post-mortem meeting at 2 PM. Let's make sure all action items from yesterday's incident are tracked.

**Roberto:**
- Yesterday: Incident response and rollback
- Today: Writing detailed post-mortem document
- Blockers: None

**Aisha:**
- Yesterday: Helped with incident triage
- Today: Back to WebAuthn - PR #1901 approved, merging today
- Blockers: None

**Tomasz:**
- Yesterday: K8s migration assessment paused due to incident
- Today: Resuming assessment, documenting resource requirements
- Blockers: Need updated K8s resource quotas from Roberto

---

### Monday, February 23, 2026

**Team Nimbus Standup**

**Priya:** Last week of Sprint S04. Let's close out remaining items.

**Aisha:**
- Today: WebAuthn merged! Starting integration tests with enhanced-mfa feature flag
- Feature flag: `aegis.enhanced-mfa` - currently admin users only
- Blockers: None

**Tomasz:**
- Today: K8s migration doc complete. Recommending phased approach: auth-service first, then core-api, then search.
- Blockers: None

**Roberto:**
- Today: Kong compatibility check added to CI (PR #1910) - action item from incident complete
- Blockers: None

---

### Tuesday, February 24, 2026

**Team Nimbus Standup**

**Aisha:**
- Yesterday: WebAuthn + enhanced-mfa integration tests passing
- Today: Deploying enhanced-mfa to staging
- Blockers: None

**DEPLOY LOG - 2:00 PM UTC:**
- Deployed enhanced-mfa feature to staging
- Feature flag `aegis.enhanced-mfa` enabled for admin users in staging
- All smoke tests passing
- WebAuthn registration and authentication flows verified

---

### Wednesday, February 25, 2026

**Team Nimbus Standup**

**Lin:**
- Yesterday: Notification center UI complete - all features working
- Today: Final accessibility audit and keyboard navigation fixes
- Blockers: None

**Yuki:**
- Yesterday: Developer quickstart guide published (PR #1915 merged)
- Today: Starting internal API changelog automation
- Blockers: None

---

### Thursday, February 26, 2026

**Team Nimbus Standup**

**All:** Sprint S04 wrap-up. Key achievements:
- WebAuthn support shipped (Aisha)
- Redis connection pool merged (Tomasz)
- K8s migration plan documented (Roberto + Tomasz)
- Notification center ready for beta (Lin)
- Developer quickstart guide published (Yuki)

**Sprint Velocity:** 42 points (target: 40)

---

### Monday, March 2, 2026

**Team Nimbus Standup - Sprint 2026-S05 Kickoff**

**Priya:** S05 priorities: K8s migration Phase 1, notification center beta launch, SOC 2 prep support.

**Roberto:**
- Today: Starting K8s migration of auth-service to production
- Migration ticket: K8S-001
- Blockers: None

**Tomasz:**
- Today: Preparing core-api for K8s (containerization improvements, health checks)
- Blockers: None

---

### Tuesday, March 3, 2026

**Team Aegis Standup (9:00 AM GMT)**

**James:** SOC 2 auditor arrives March 20. All hands on deck for preparation.

**Sarah:**
- Yesterday: Completed penetration test report for Q1
- Today: Remediation verification for 3 critical findings
- Findings: All 3 patched (auth-service XSS, SQL injection in search, SSRF in webhooks)
- Blockers: None

**Dmitri:**
- Yesterday: SIEM rule tuning - reduced false positives by 40%
- Today: Preparing security event logs for SOC 2 evidence
- Blockers: Need 6 months of access logs from AWS CloudTrail

**Fatima:**
- Yesterday: Completed threat model for WebAuthn (finally!)
- Today: DAST scanning setup for billing-service
- Blocker: Billing service uses custom auth header that DAST tool doesn't support

---

### Wednesday, March 4, 2026

**Team Nimbus Standup**

**Roberto:**
- Yesterday: Auth-service migrated to K8s production! Running stable.
- Today: Monitoring K8s auth-service, setting up HPA (Horizontal Pod Autoscaler)
- Blockers: None

**K8s Migration Status:**
| Service | Status | Date |
|---------|--------|------|
| auth-service | LIVE on K8s | March 3, 2026 |
| core-api | In progress | Target: March 14 |
| search-service | Planned | Target: March 21 |
| notification-service | Planned | Target: March 28 |

---

### Thursday, March 5, 2026

**Team Nimbus Standup**

**Tomasz:**
- Yesterday: Core-api health checks implemented, Dockerfile optimized (image size reduced from 1.2GB to 340MB)
- Today: Writing K8s manifests for core-api
- Blockers: None

**Lin:**
- Yesterday: Notification center beta launched to 10% of users
- Today: Monitoring engagement metrics, fixing reported UI bugs
- Blockers: Users reporting notifications not appearing on Safari (investigating)
- Bug ticket: PRISM-289

---

### Friday, March 6, 2026

**Team Nimbus Standup**

**Lin:**
- Yesterday: Safari notification bug found - WebSocket connection drops after 60 seconds on Safari
- Root cause: Safari's aggressive WebSocket timeout policy
- Fix: Implementing heartbeat ping every 30 seconds
- PR: #1928
- Blockers: None

---

### Monday, March 9, 2026

**Team Nimbus Standup**

**Priya:** Mid-sprint check. K8s migration on track, notification center safari fix deployed.

**Roberto:**
- Today: Core-api K8s manifests reviewed by Tomasz, deploying to staging
- Blockers: None

**Tomasz:**
- Today: Setting up K8s monitoring with Prometheus + Grafana
- Created new dashboard: https://grafana.internal/d/k8s-migration
- Blockers: None

---

### Tuesday, March 10, 2026

**Team Nimbus Standup**

**Roberto:**
- Yesterday: Core-api deployed to K8s staging
- Today: Running load tests against K8s staging core-api
- Blockers: None

**ARCHITECTURE REVIEW BOARD (11:00 AM UTC)**
- CockroachDB proposal discussed and DEFERRED to Q2
- See meeting notes in brain.md

---

### Wednesday, March 11, 2026

**Team Nimbus Standup**

**Roberto:**
- Yesterday: Load tests complete. K8s core-api handles 20% more throughput than EC2 version.
- Today: Preparing production migration plan
- Blockers: None

**Aisha:**
- Yesterday: Started API rate limiting overhaul (SEC-2026-014)
- Today: Implementing new tiered rate limits (Free/Standard/Pro/Enterprise)
- Blockers: None

---

### Thursday, March 12, 2026

**Team Nimbus Standup**

**Aisha:**
- Yesterday: New rate limiting tiers implemented
- Today: Deploying rate limit changes to staging, enabling `nimbus.kafka-streaming` feature flag in staging
- Feature flag update: `nimbus.kafka-streaming` now ENABLED in staging
- Blockers: None

**Roberto:**
- Today: Core-api production migration scheduled for next Tuesday (March 17)
- Migration ticket: K8S-002
- Blockers: None

**Lin:**
- Yesterday: Notification center engagement: 23% of beta users enabling notifications
- Today: Expanding beta to 50% of users
- Blockers: None

---

### Friday, March 13, 2026

**Team Nimbus Standup**

**All:** Sprint S05 final day. Wrapping up items.
- K8s auth-service: LIVE
- K8s core-api: Staging complete, prod scheduled Tuesday
- Notification center: 50% beta rollout
- Rate limiting overhaul: Staging deployment complete
- Safari WebSocket fix: Deployed and verified

**Sprint Velocity:** 38 points (target: 40)

---

### Monday, March 16, 2026

**Team Nimbus Standup - Sprint 2026-S06 Kickoff**

**Priya:** Hackathon today and tomorrow! Reduced standup. S06 starts Wednesday.

**Hackathon Teams:**
- Team "Speed Demons" (Aisha + Tomasz): API response time optimization challenge
- Team "K8s Krushers" (Roberto + Lin): Auto-scaling prediction using ML
- Team "Doc Bot" (Yuki + Mei-Ling from Prism): AI-powered internal documentation search

---

### Tuesday, March 17, 2026

**Hackathon Day 2 + Core-API K8s Migration**

**DEPLOY LOG - Core-API to K8s Production (2:00 PM UTC):**
- 2:00 PM: Migration started - traffic shifted 10% to K8s pods
- 2:15 PM: Canary healthy, shifting to 25%
- 2:30 PM: 50% traffic on K8s
- 2:45 PM: 75% traffic on K8s
- 3:00 PM: 100% traffic on K8s, EC2 instances on standby
- 3:30 PM: All health checks green
- 4:00 PM: EC2 instances terminated. Migration complete.
- **Zero downtime achieved!**

**Hackathon Results:**
- Winner: Team "Speed Demons" - Reduced p99 latency from 340ms to 180ms using connection pooling optimizations and query batching
- Runner-up: Team "Doc Bot" - Built Slack bot that searches internal docs using RAG
- Team "K8s Krushers" - Built proof-of-concept but needs more training data

---

### Wednesday, March 18, 2026

**Team Nimbus Standup - Sprint S06 Official Start**

**Priya:** Amazing hackathon results! Speed Demons' optimizations will be prioritized for production. Also, SOC 2 auditor arrives in 2 days.

**Aisha:**
- Today: Productionizing hackathon latency optimizations
- PR: #1945 (connection pooling) and #1946 (query batching)
- Blockers: None

**K8s Migration Status Update:**
| Service | Status | Date |
|---------|--------|------|
| auth-service | LIVE on K8s | March 3 |
| core-api | LIVE on K8s | March 17 |
| search-service | In progress | Target: March 24 |
| notification-service | Planned | Target: March 31 |

---

### Thursday, March 19, 2026

**Team Nimbus Standup**

**Aisha:**
- Yesterday: Connection pooling PR #1945 merged
- Today: Query batching PR #1946 in review
- Current p99 latency: 210ms (down from 340ms, target: 200ms)
- Blockers: None

**Roberto:**
- Yesterday: Search-service K8s manifests created
- Today: Deploying search-service to K8s staging
- Blockers: Search-service uses local file storage for index - need to switch to EFS

---

### Friday, March 20, 2026

**SOC 2 Audit Day 1**

**Team Aegis + All Teams:**
- Auditor from Ernst & Young on-site
- Reviewing: Access controls, change management, incident response
- James coordinating all evidence collection
- Dmitri providing CloudTrail logs and SIEM reports
- Fatima demonstrating DAST scanning pipeline

**No deploys today per SOC 2 audit protocol**

---

### Monday, March 23, 2026

**SOC 2 Audit Day 3**

**James (via Slack):**
- Audit going well. Auditor impressed with incident response procedures.
- One finding: Need to document data retention policy more clearly
- Dmitri working on data retention documentation
- Audit wraps up tomorrow

---

### Tuesday, March 24, 2026

**SOC 2 Audit Day 4 (Final Day)**

**James:**
- Audit complete. Preliminary result: PASS with 2 minor observations
- Observations:
  1. Data retention policy documentation needs formalization (low risk)
  2. Two developer accounts had stale MFA devices (corrected same day)
- Final report expected in 4-6 weeks
- Celebrating at team dinner tonight!

**Roberto:**
- Search-service deployed to K8s staging (EFS integration working)
- Target prod migration: Thursday March 26
- Blockers: None

---

### Wednesday, March 25, 2026

**Team Nimbus Standup**

**Aisha:**
- Query batching PR #1946 merged
- Current p99 latency: 195ms - **BELOW 200ms TARGET!**
- OKR O1 achieved!

**Tomasz:**
- Kafka streaming pipeline monitoring shows 99.97% delivery rate
- One edge case: Messages over 1MB getting silently dropped
- Fix: Implementing message compression + size limit check
- PR: #1952

---

### Thursday, March 26, 2026

**Team Nimbus Standup**

**DEPLOY LOG - Search-Service to K8s Production (2:00 PM UTC):**
- 2:00 PM: Migration started
- 2:10 PM: Canary at 10% - search latency slightly higher than EC2
- 2:20 PM: Investigated - EFS IOPS limit hit. Increased to 3000 IOPS.
- 2:30 PM: Canary stable after EFS upgrade
- 2:45 PM: 50% traffic
- 3:00 PM: 100% traffic
- 3:15 PM: All green. EC2 search instances on standby for 24h.
- **Migration successful, zero downtime**

**K8s Migration Status:**
| Service | Status | Date |
|---------|--------|------|
| auth-service | LIVE on K8s | March 3 |
| core-api | LIVE on K8s | March 17 |
| search-service | LIVE on K8s | March 26 |
| notification-service | In progress | Target: April 1 |

K8s migration now at **60%** (3 of 5 tier-1 services)

---

### Friday, March 27, 2026

**Team Nimbus Standup**

**Priya:** Great progress this sprint! Quarter ends Monday. No deploys next week (Q1 freeze).

**Sprint S06 Achievements:**
- p99 latency reduced to 195ms (target: 200ms) - OKR O1 ACHIEVED
- K8s migration at 60% (target: 80% by Q1 end) - OKR O2 partially met
- Search-service migrated successfully
- Kafka pipeline at 99.97% delivery rate

---

### Monday, March 30, 2026

**Q1 Freeze - No Deploys**

**Priya (via Slack):**
- Q1 retrospective scheduled for Wednesday
- Q2 planning starts Thursday
- Everyone: Update your OKR progress in Lattice by EOD Tuesday

---

### Tuesday, March 31, 2026

**Q1 Last Day - No Standup (Freeze)**

**Key Q1 Metrics (shared by Marcus):**
- Uptime: 99.94% (target: 99.95% - missed by 0.01% due to Feb 19 incident)
- API p99: 195ms (target: 200ms - ACHIEVED)
- K8s migration: 60% (target: 80% - partially met, on track for Q2)
- SOC 2: Passed with minor observations - ACHIEVED
- MAU: 142,000 (up from 125,000 at start of Q1)
- API requests/day: 11.3 million (up from 8.2 million)

---

### Wednesday, April 1, 2026

**Sprint 2026-S07 Kickoff + Q2 Planning**

**Priya:** Q2 priorities:
1. Complete K8s migration (remaining: notification-service, billing-service)
2. CockroachDB evaluation (deferred from Q1)
3. API v1 deprecation (remove by July 1)
4. New search UI full rollout

**Roberto:**
- Today: Notification-service K8s migration prep
- Deploying notification-service to K8s staging
- Blockers: WebSocket support on K8s ingress needs configuration

---

### Thursday, April 2, 2026

**Team Nimbus Standup**

**Roberto:**
- Yesterday: WebSocket K8s ingress configured using annotations
- Today: Notification-service K8s staging deployment
- Blockers: None

**Tomasz:**
- Today: Starting CockroachDB POC on staging (deferred from Architecture Review Board)
- Setting up CockroachDB cluster: 3 nodes on staging
- Blockers: None

**Lin:**
- Today: New search UI (`nimbus.new-search-ui`) - expanding from 20% to 50% of users
- Feature flag update: `nimbus.new-search-ui` now at 50% rollout
- Blockers: None

---

### Friday, April 3, 2026

**Team Nimbus Standup**

**Roberto:**
- Yesterday: Notification-service running on K8s staging, WebSockets working
- Today: Load testing WebSocket connections on K8s
- Result: K8s handles 5,000 concurrent WebSocket connections (target: 3,000)
- Blockers: None

**Tomasz:**
- Yesterday: CockroachDB 3-node cluster running on staging
- Today: Running compatibility tests with core-api queries
- Initial finding: 95% of queries work without modification, 5% need syntax adjustments
- Blockers: None
