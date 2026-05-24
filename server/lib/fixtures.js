export const FALLBACKS = {
  B: {
    summary: "A misconfigured db.pool.max_connections (5 instead of 50) shipped in payments-api v2.4.2 exhausted the DB connection pool within seconds of deployment, causing payment failures and a P1 alert; rollback to v2.4.1 restored service in under 60 seconds.",
    timeline: [
      { time: "03:11:02", event: "Deploy initiated: payments-api v2.4.1 → v2.4.2 by ci-bot" },
      { time: "03:11:09", event: "Rolling update started: 3/6 pods replaced" },
      { time: "03:11:14", event: "Rolling update complete: 6/6 pods replaced" },
      { time: "03:11:16", event: "WARN: db.pool.max_connections=5 loaded — down from 50 in v2.4.1" },
      { time: "03:11:25", event: "Pool exhausted — first payment transactions fail" },
      { time: "03:11:32", event: "P1 alert fired: payment success rate 3% (baseline: 99.1%)" },
      { time: "03:11:40", event: "Rollback triggered: v2.4.2 → v2.4.1" },
      { time: "03:11:47", event: "Rollback complete: v2.4.1 fully restored" },
      { time: "03:12:01", event: "Success rate recovered to 97.4% — incident resolving" },
    ],
    hypotheses: [
      {
        title: "Misconfigured db.pool.max_connections in v2.4.2 deploy",
        strength: "HIGH",
        explanation: "Config regression set pool to 5 (from 50); exhausted within 3s of traffic.",
        evidence: [
          "03:11:16 [payments-api] WARN Config loaded: db.pool.max_connections=5 (was 50)",
          "03:11:25 [payments-api] ERROR DB connection pool exhausted",
        ],
      },
      {
        title: "No config validation gate in the deploy pipeline",
        strength: "MED",
        explanation: "Deploy pipeline had no pre-flight check on critical config values.",
        evidence: ["03:11:02 [deployment-service] INFO Deploy initiated: payments-api v2.4.1 -> v2.4.2 by ci-bot"],
      },
    ],
    fixSteps: [
      "Rollback already applied — verify v2.4.1 is stable: `kubectl rollout status deployment/payments-api`",
      "Audit config diff: `git diff v2.4.1..v2.4.2 -- config/` and add a schema test asserting pool size >= 20",
      "Add a pre-deploy CI gate that parses rendered config and asserts critical numeric values are within safe bounds",
    ],
    severityScore: 8,
    severityReason: "Payment processing fully down for ~45s affecting all transactions, required manual rollback.",
  },
  A: {
    summary: "Redis primary ran out of memory, causing key eviction and connection pool exhaustion across all API gateways, triggering a full P1 503 outage that cascaded into a secondary Postgres connection saturation event after failover.",
    timeline: [
      { time: "03:41:02", event: "Redis memory at 97.5% (7.8GB/8GB) — system near capacity" },
      { time: "03:41:15", event: "LRU eviction triggers — Redis begins evicting active session keys" },
      { time: "03:41:23", event: "Connection pool saturation: 48-49/50 connections blocked" },
      { time: "03:41:27", event: "All API gateways begin issuing HTTP 503" },
      { time: "03:41:29", event: "P1 incident triggered: API 503 rate >50% across all regions" },
      { time: "03:41:31", event: "Redis OOM killer fires — redis-primary-1 terminated" },
      { time: "03:41:32", event: "Sentinel promotes redis-replica-2 to primary" },
      { time: "03:42:01", event: "Postgres connection limit reached (498/500) — secondary cascade" },
    ],
    hypotheses: [
      {
        title: "Redis OOM due to unbounded memory growth",
        strength: "HIGH",
        explanation: "Redis hit its 8GB maxmemory limit; OOM killer terminated the process causing connection pool starvation.",
        evidence: [
          "03:41:31 — Out of memory: Kill process or sacrifice child",
          "03:41:18 — evicted_keys delta=2847 in last 10s — cache thrashing detected",
        ],
      },
      {
        title: "No cache warming on Redis failover",
        strength: "MED",
        explanation: "After failover, no cache warming step ran, causing a cold-start miss storm exhausting Postgres.",
        evidence: [
          "03:41:42 — Cold cache detected — replica-2 hit rate 2.1% (was 94.3%)",
          "03:42:01 — too many connections: 498/500 (max_connections=500)",
        ],
      },
    ],
    fixSteps: [
      "Set maxmemory-policy to noeviction and raise maxmemory to 90% of available RAM: `redis-cli CONFIG SET maxmemory-policy noeviction`",
      "Run cache warmer before re-enabling traffic: `kubectl create job cache-warm --from=cronjob/cache-warmer`",
      "Add Redis memory alerts at 70% and 85% in Prometheus: `redis_memory_used_bytes / redis_memory_max_bytes`",
    ],
    severityScore: 9,
    severityReason: "Full P1 outage across all regions with secondary Postgres cascade, required manual intervention.",
  },
}
