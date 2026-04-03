# RFC-2024-037: Migration from PostgreSQL to CockroachDB for Multi-Region Deployment

## Status: Proposed
## Author: Platform Engineering Team
## Date: 2024-11-15

## Abstract
This RFC proposes migrating our primary OLTP workload from a single-region PostgreSQL 15 cluster (3-node streaming replication, pgBouncer connection pooling) to a multi-region CockroachDB 23.2 cluster spanning us-east-1, eu-west-1, and ap-southeast-1.

## Motivation
Current P99 latency for EU and APAC users exceeds 380ms due to cross-Atlantic/Pacific round trips to our us-east-1 PostgreSQL primary. Our SLA requires sub-100ms P99 for all regions. The read replica approach with pg_basebackup introduces replication lag of 50-200ms, which violates our read-after-write consistency requirements for the checkout flow.

## Technical Design

### Schema Changes
- All tables require a `crdb_region` column for zone-based partitioning using REGIONAL BY ROW.
- Foreign key constraints crossing partition boundaries will use INTERLEAVED index removal (deprecated in CRDB 23.1) replaced with implicit RBR FK handling.
- JSONB columns using GIN indexes must migrate to inverted indexes with STORING clause adjustments.

### Data Migration
- Phase 1: Shadow writes via CDC (Change Data Capture) using Debezium Kafka connectors.
- Phase 2: Dual-read validation using a traffic splitter at the application layer (feature flag per-tenant).
- Phase 3: Cutover with pg_dump-based seed for cold data, CDC catchup for hot data. Estimated downtime: 15 minutes.

### Connection Layer
- Replace pgBouncer with CockroachDB's built-in connection pooling (`sql.defaults.conn_results_buffer_size`).
- Update JDBC/pgx connection strings to use CockroachDB's load-balanced DNS with region-aware routing.
- Application-level retry logic for CRDB's serializable isolation transaction retries (error code 40001).

## Performance Projections
- EU P99 latency: 380ms -> 45ms (local reads from eu-west-1 leaseholder)
- APAC P99 latency: 520ms -> 60ms (local reads from ap-southeast-1 leaseholder)
- US P99 latency: 12ms -> 18ms (slight increase due to Raft consensus overhead)
- Write throughput: 12,000 TPS -> 9,500 TPS initially (quorum writes), scaling to 15,000 TPS with follower reads optimization.

## Cost Analysis
- Current PostgreSQL: $14,200/month (3x r6g.2xlarge + 2TB gp3 EBS + pgBouncer EC2)
- Projected CockroachDB: $28,500/month (9-node cluster across 3 regions, n2-standard-8 equivalent)
- Net increase: $14,300/month (+100%)
- ROI justification: EU/APAC user conversion rate uplift of 2.3% (estimated from latency-conversion correlation model) yields $47,000/month additional revenue.

## Timeline
- Week 1-2: Schema compatibility analysis and migration script development
- Week 3-6: Shadow write pipeline setup and validation
- Week 7-8: Dual-read testing with 10% traffic
- Week 9-10: Full dual-read with automated comparison
- Week 11: Cutover rehearsal in staging
- Week 12: Production cutover

## Risks
- CockroachDB serializable isolation may surface hidden read-write conflicts in our existing READ COMMITTED transaction logic.
- JSONB query performance regression due to inverted index behavioral differences.
- Operational complexity increase - team has zero CockroachDB production experience.
