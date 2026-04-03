# Capacity Planning Challenge - Nexus Platform

## Current Infrastructure

| Component | Spec | Current Usage | Limit |
|-----------|------|---------------|-------|
| API Servers | 4x t3.medium (2 vCPU, 4GB RAM) | 65% CPU avg, 72% memory avg | Auto-scale group, max 8 |
| Database | db.r6g.large (2 vCPU, 16GB RAM) | 45% CPU, 60% memory, 1200 connections/sec | Single primary, 1 read replica |
| Redis | cache.r6g.large (2 vCPU, 13GB) | 3.2GB used, 8k ops/sec | Single node |
| CDN | CloudFront | 2.1TB/month transfer, 85% cache hit | No hard limit |
| Storage | S3 | 450GB, 12k req/min | No hard limit |
| Load Balancer | ALB | 3,200 req/sec peak | 10k connections |

## Current Traffic

- **Daily active users:** 12,000
- **Peak concurrent users:** 1,800 (weekdays 10am-12pm UTC)
- **Average API latency:** 145ms (p50), 380ms (p95), 890ms (p99)
- **Request rate:** 2,400 req/sec average, 3,200 req/sec peak
- **Database queries:** 8,500 queries/sec peak
- **WebSocket connections:** 900 concurrent peak

## Growth Projections

The business team projects the following growth over the next 12 months:

| Quarter | DAU Target | Req/sec Peak (est.) | Notes |
|---------|-----------|---------------------|-------|
| Q1 (now) | 12,000 | 3,200 | Current state |
| Q2 | 25,000 | 6,800 | Launch in EU market |
| Q3 | 50,000 | 14,000 | Enterprise tier launch, bulk imports |
| Q4 | 100,000 | 30,000 | Mobile app launch |

## Known Bottlenecks

1. **Database write contention:** The primary handles all writes. During bulk task imports (enterprise feature, Q3), write throughput spikes 10x for 2-5 minutes.
2. **WebSocket scaling:** Current single-server WebSocket architecture cannot scale horizontally. At 5,000 concurrent connections, the server runs out of file descriptors.
3. **Image processing:** Synchronous image resize on upload blocks API threads. Average processing time: 2.3 seconds per image.
4. **Search:** Full-text search runs on the primary database. At 50k+ DAU, search queries will compete with transactional queries.
5. **Session storage:** All sessions in a single Redis node. No clustering or failover.

## Budget Constraints

- Current monthly infra cost: $2,800/month
- Approved budget growth: up to $12,000/month by Q4
- Must justify any component that costs more than $500/month
- Prefer managed services over self-hosted where cost-effective

## Your Task

Create a detailed capacity scaling plan for Q2 through Q4 that addresses:
1. Which components need to scale and when
2. Horizontal vs vertical scaling decisions for each component
3. How to solve each of the 5 known bottlenecks
4. Caching strategy improvements
5. CDN and edge optimization
6. Cost estimates per quarter
7. Migration/implementation timeline
8. Risk assessment - what breaks first if growth exceeds projections by 50%
