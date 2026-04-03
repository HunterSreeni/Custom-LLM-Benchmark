# Incident Runbook - Nexus Platform Production

## Runbook Version: 1.3
## Last Updated: 2025-01-10

---

## 1. API Unresponsive (HTTP 502/503/504)

**Severity:** P1 - Critical
**SLA:** Acknowledge within 5 minutes, resolve within 30 minutes

### Diagnosis Steps:
1. Check ALB target health: `aws elbv2 describe-target-health --target-group-arn $TG_ARN`
2. Check pod status: `kubectl get pods -n production -l app=nexus-api`
3. Check recent deployments: `kubectl rollout history deployment/nexus-api -n production`
4. Check Node.js process: `kubectl exec -it <pod> -- node -e "console.log(process.memoryUsage())"`

### Resolution Steps:
1. If pods are in CrashLoopBackOff - check logs: `kubectl logs <pod> -n production --previous`
2. If memory issue - restart affected pods: `kubectl delete pods --all -n production`
3. If deployment issue - rollback: `kubectl rollout undo deployment/nexus-api -n production`
4. If load spike - scale up: `kubectl scale deployment/nexus-api --replicas=8 -n production`

---

## 2. Database Connection Exhaustion

**Severity:** P1 - Critical
**SLA:** Acknowledge within 5 minutes, resolve within 15 minutes

### Diagnosis Steps:
1. Check active connections: `SELECT count(*) FROM pg_stat_activity;`
2. Check long-running queries: `SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC;`
3. Check connection pool status via app metrics dashboard

### Resolution Steps:
1. Kill long-running queries: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE duration > interval '60 seconds' AND state = 'active';`
2. If pool exhausted - restart API pods one at a time: `kubectl rollout restart deployment/nexus-api -n production`
3. If persistent - increase pool size in config and redeploy

---

## 3. Redis Failure

**Severity:** P2 - High
**SLA:** Acknowledge within 10 minutes, resolve within 45 minutes

### Diagnosis Steps:
1. Check Redis connectivity: `redis-cli -h redis-prod.internal ping`
2. Check memory: `redis-cli -h redis-prod.internal info memory`
3. Check slow log: `redis-cli -h redis-prod.internal slowlog get 10`

### Resolution Steps:
1. If memory full - flush expired keys: `redis-cli -h redis-prod.internal FLUSHALL`
2. If connection refused - restart Redis service
3. If data corruption - restore from last backup: `aws s3 cp s3://nexus-backups/redis/latest.rdb ./dump.rdb`

---

## 4. High Error Rate (>5% 5xx)

**Severity:** P2 - High
**SLA:** Acknowledge within 10 minutes, resolve within 30 minutes

### Diagnosis Steps:
1. Check Sentry for top errors: https://sentry.io/nexus-platform/
2. Check API logs: `kubectl logs -l app=nexus-api -n production --since=10m | grep ERROR`
3. Check if specific endpoint or global: review ALB access logs
4. Check external dependency health (Stripe, SendGrid, etc.)

### Resolution Steps:
1. If caused by recent deploy - rollback: `kubectl rollout undo deployment/nexus-api -n production`
2. If external dependency - enable circuit breaker via feature flag
3. If data issue - identify and fix affected records

---

## 5. Disk Space Alert

**Severity:** P3 - Medium
**SLA:** Acknowledge within 30 minutes, resolve within 2 hours

### Diagnosis Steps:
1. Check disk usage: `df -h`
2. Find large files: `du -sh /var/log/* | sort -rh | head -20`
3. Check log rotation config

### Resolution Steps:
1. Clean old logs: `find /var/log -name "*.log" -mtime +7 -delete`
2. Clean Docker images: `docker system prune -af`
3. If DB disk - extend EBS volume via AWS console

---

## 6. SSL Certificate Expiry

**Severity:** P2 - High
**SLA:** Resolve before expiry

### Diagnosis Steps:
1. Check cert expiry: `echo | openssl s_client -connect api.nexus-platform.com:443 2>/dev/null | openssl x509 -noout -dates`

### Resolution Steps:
1. If ACM managed - check ACM console for auto-renewal status
2. If manual - renew via Let's Encrypt: `certbot renew`
3. Update ALB listener with new certificate ARN

---

## Emergency Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| On-call Primary | Rotation | PagerDuty | #incident-response |
| On-call Secondary | Rotation | PagerDuty | #incident-response |
| Engineering Lead | Priya M. | +91-XXXXXXXXXX | @priya |
| DevOps Lead | Arjun K. | +91-XXXXXXXXXX | @arjun |
| CTO | Vikram S. | +91-XXXXXXXXXX | @vikram |

---

## Escalation Matrix

| Time Elapsed | Action |
|-------------|--------|
| 0-5 min | On-call primary acknowledges |
| 5-15 min | On-call secondary joins if primary unavailable |
| 15-30 min | Engineering lead notified |
| 30+ min | CTO notified, war room opened |

---

## Post-Incident

After every P1/P2 incident:
1. Create incident report within 24 hours
2. Schedule blameless post-mortem within 48 hours
3. Track action items in Linear under "Reliability" project
4. Update this runbook if any steps were incorrect or missing
