export const SCENARIOS = [
  {
    id: 'A',
    label: 'Scenario A',
    title: 'Redis OOM → API 503s',
    description: 'Redis memory exhaustion cascading to API timeouts',
    logs: `2026-05-24T03:41:02.113Z [redis-primary-1] INFO  Memory usage: 7.8GB / 8.0GB (97.5%)
2026-05-24T03:41:15.442Z [redis-primary-1] WARN  maxmemory-policy allkeys-lru: evicting keys under memory pressure
2026-05-24T03:41:18.887Z [redis-primary-1] WARN  evicted_keys delta=2847 in last 10s — cache thrashing detected
2026-05-24T03:41:22.001Z [api-gateway-3]   WARN  Redis GET latency p99=2340ms (threshold: 500ms) — circuit breaker at 60%
2026-05-24T03:41:23.334Z [api-gateway-1]   ERROR Redis connection pool: 48/50 connections blocked waiting (timeout=3000ms)
2026-05-24T03:41:24.009Z [api-gateway-2]   ERROR Redis connection pool: 49/50 connections blocked waiting (timeout=3000ms)
2026-05-24T03:41:25.112Z [session-svc]     ERROR Failed to read session token: REDIS_TIMEOUT after 3001ms key=sess:u:8823941
2026-05-24T03:41:25.448Z [session-svc]     ERROR Failed to read session token: REDIS_TIMEOUT after 3002ms key=sess:u:9012334
2026-05-24T03:41:25.891Z [session-svc]     ERROR Failed to read session token: REDIS_TIMEOUT after 3000ms key=sess:u:7741029
2026-05-24T03:41:26.001Z [api-gateway-1]   ERROR Upstream timeout: session-svc /validate returned 504 after 3100ms
2026-05-24T03:41:26.334Z [api-gateway-2]   ERROR Upstream timeout: session-svc /validate returned 504 after 3089ms
2026-05-24T03:41:26.772Z [api-gateway-3]   ERROR Upstream timeout: session-svc /validate returned 504 after 3094ms
2026-05-24T03:41:27.001Z [api-gateway-1]   ERROR HTTP 503 Service Unavailable — downstream failure threshold exceeded (>80%)
2026-05-24T03:41:27.112Z [api-gateway-2]   ERROR HTTP 503 Service Unavailable — downstream failure threshold exceeded (>80%)
2026-05-24T03:41:27.334Z [api-gateway-3]   ERROR HTTP 503 Service Unavailable — downstream failure threshold exceeded (>80%)
2026-05-24T03:41:28.001Z [load-balancer]   WARN  Health check FAILED: api-gateway-1 /healthz returned 503
2026-05-24T03:41:28.112Z [load-balancer]   WARN  Health check FAILED: api-gateway-2 /healthz returned 503
2026-05-24T03:41:28.334Z [load-balancer]   WARN  Health check FAILED: api-gateway-3 /healthz returned 503
2026-05-24T03:41:29.001Z [pagerduty]       CRIT  P1 INCIDENT TRIGGERED: API 503 rate >50% — all regions affected
2026-05-24T03:41:31.223Z [redis-primary-1] ERROR Out of memory: Kill process or sacrifice child
2026-05-24T03:41:31.224Z [redis-primary-1] ERROR KILLED by OOM killer — process terminated
2026-05-24T03:41:31.891Z [redis-sentinel-1] WARN  redis-primary-1 is DOWN — initiating failover
2026-05-24T03:41:32.001Z [redis-sentinel-1] INFO  Promoting redis-replica-2 to primary
2026-05-24T03:41:34.447Z [redis-replica-2] INFO  Replication complete — now serving as primary
2026-05-24T03:41:35.112Z [api-gateway-1]   INFO  Redis reconnected to replica-2:6379 — pool recovering
2026-05-24T03:41:35.334Z [api-gateway-2]   INFO  Redis reconnected to replica-2:6379 — pool recovering
2026-05-24T03:41:42.001Z [cache-warmer]    WARN  Cold cache detected — replica-2 hit rate 2.1% (was 94.3%)
2026-05-24T03:41:44.009Z [api-gateway-1]   WARN  Cache miss storm: 4200 req/s hitting DB directly (baseline: 420)
2026-05-24T03:42:01.334Z [postgres-primary] ERROR too many connections: 498/500 (max_connections=500)
2026-05-24T03:42:01.891Z [postgres-primary] ERROR connection refused: remaining connection slots reserved for non-replication superuser
2026-05-24T03:42:03.009Z [api-gateway-1]   ERROR Database connection failed: PG_CONN_REFUSED — secondary cascade failure
2026-05-24T03:42:03.112Z [api-gateway-2]   ERROR Database connection failed: PG_CONN_REFUSED — secondary cascade failure
`,
  },
  {
    id: 'B',
    label: 'Scenario B',
    title: 'Bad Deploy → Payment Failures',
    description: 'DB connection pool exhaustion from bad deployment',
    logs: `2026-05-24T14:02:11.001Z [deploy-svc]      INFO  Deploying payment-service v2.4.1 → v2.4.2 (rollout: 10%)
2026-05-24T14:02:14.334Z [deploy-svc]      INFO  payment-service v2.4.2 pod 1/10 healthy — continuing rollout
2026-05-24T14:02:19.001Z [payment-svc-v2]  INFO  Starting payment-service v2.4.2 — db pool config: min=20, max=200
2026-05-24T14:02:19.112Z [payment-svc-v2]  WARN  DB pool: acquiring 20 baseline connections (pool_min=20)
2026-05-24T14:02:21.334Z [payment-svc-v2]  INFO  DB pool ready: 20 connections acquired
2026-05-24T14:02:31.001Z [deploy-svc]      INFO  Deploying payment-service v2.4.2 — scaling to 50% (5 pods)
2026-05-24T14:02:33.112Z [payment-svc-v2]  INFO  pod 2/10 starting — acquiring db connections
2026-05-24T14:02:33.334Z [payment-svc-v2]  INFO  pod 3/10 starting — acquiring db connections
2026-05-24T14:02:33.891Z [payment-svc-v2]  INFO  pod 4/10 starting — acquiring db connections
2026-05-24T14:02:34.001Z [payment-svc-v2]  INFO  pod 5/10 starting — acquiring db connections
2026-05-24T14:02:34.447Z [postgres-payments] WARN  Active connections: 112/150 (74%) — approaching limit
2026-05-24T14:02:38.001Z [deploy-svc]      INFO  Deploying payment-service v2.4.2 — scaling to 100% (10 pods)
2026-05-24T14:02:39.112Z [payment-svc-v2]  INFO  pod 6/10 starting — acquiring db connections
2026-05-24T14:02:39.334Z [payment-svc-v2]  INFO  pod 7/10 starting — acquiring db connections
2026-05-24T14:02:39.891Z [payment-svc-v2]  INFO  pod 8/10 starting — acquiring db connections
2026-05-24T14:02:40.001Z [postgres-payments] ERROR Active connections: 151/150 — connection limit exceeded
2026-05-24T14:02:40.112Z [postgres-payments] ERROR FATAL: remaining connection slots reserved for non-replication superuser
2026-05-24T14:02:40.334Z [payment-svc-v2]  ERROR DB pool exhausted: unable to acquire connection after 5000ms — pod 8
2026-05-24T14:02:40.447Z [payment-svc-v2]  ERROR DB pool exhausted: unable to acquire connection after 5000ms — pod 9
2026-05-24T14:02:40.891Z [payment-svc-v2]  ERROR DB pool exhausted: unable to acquire connection after 5000ms — pod 10
2026-05-24T14:02:41.001Z [payment-svc-v2]  ERROR POST /api/v1/charge returned 500: DB_POOL_EXHAUSTED txn_id=txn_8812334
2026-05-24T14:02:41.112Z [payment-svc-v2]  ERROR POST /api/v1/charge returned 500: DB_POOL_EXHAUSTED txn_id=txn_8812335
2026-05-24T14:02:41.334Z [payment-svc-v2]  ERROR POST /api/v1/charge returned 500: DB_POOL_EXHAUSTED txn_id=txn_8812336
2026-05-24T14:02:42.001Z [payment-svc-v2]  ERROR POST /api/v1/refund returned 500: DB_POOL_EXHAUSTED txn_id=refund_441209
2026-05-24T14:02:42.334Z [stripe-webhook]  WARN  Retry attempt 1/3 for charge event evt_1OxK2LJZ — previous attempt 500
2026-05-24T14:02:43.001Z [fraud-detection]  ERROR Cannot query transaction history: DB_CONN_REFUSED — bypassing fraud check
2026-05-24T14:02:44.112Z [ops-monitor]     CRIT  Payment error rate: 94.3% (threshold: 5%) — P1 INCIDENT CREATED
2026-05-24T14:02:45.334Z [payment-svc-v2]  ERROR POST /api/v1/charge returned 500: DB_POOL_EXHAUSTED txn_id=txn_8812340
2026-05-24T14:02:48.001Z [deploy-svc]      WARN  Rollback initiated: payment-service v2.4.2 → v2.4.1 (error rate threshold)
2026-05-24T14:02:51.334Z [payment-svc-v1]  INFO  pod 1/10 v2.4.1 healthy — connections: 15/150 active
2026-05-24T14:02:54.001Z [postgres-payments] INFO  Connections dropping: 143 → 98 as v2.4.2 pods terminate
2026-05-24T14:02:58.334Z [postgres-payments] INFO  Connections stable: 82/150 — pool healthy
2026-05-24T14:03:01.001Z [payment-svc-v1]  INFO  POST /api/v1/charge 200 OK txn_id=txn_8812358 — service recovering
`,
  },
  {
    id: 'C',
    label: 'Scenario C',
    title: 'CDN Degradation → Frontend Crash',
    description: 'CDN edge degradation causing asset failures and JS crash',
    logs: `2026-05-24T09:15:01.334Z [cdn-edge-us-east-1] INFO  Edge node healthy — cache hit rate: 91.2%
2026-05-24T09:15:44.001Z [cdn-edge-us-east-1] WARN  BGP route flap detected: upstream provider AS7922 (Comcast) — latency spike
2026-05-24T09:15:45.112Z [cdn-edge-us-east-1] WARN  Origin pull latency p99=8340ms (baseline: 120ms) — origin unreachable?
2026-05-24T09:15:46.334Z [cdn-edge-us-east-1] ERROR Origin fetch timeout: GET /static/js/main.chunk.js (attempt 1/3) after 10000ms
2026-05-24T09:15:47.001Z [cdn-edge-us-east-1] ERROR Cache MISS + origin timeout: serving stale for /static/js/main.chunk.js (stale-age: 0s)
2026-05-24T09:15:47.334Z [cdn-edge-us-east-1] ERROR 503 returned to client for /static/js/main.chunk.js
2026-05-24T09:15:47.891Z [cdn-edge-us-east-1] ERROR 503 returned to client for /static/css/main.chunk.css
2026-05-24T09:15:48.001Z [cdn-edge-us-east-1] ERROR 503 returned to client for /static/js/vendors.chunk.js
2026-05-24T09:15:48.334Z [rum-collector]    ERROR JS error: TypeError: Cannot read properties of undefined (reading 'mount') at main.chunk.js:1:48293
2026-05-24T09:15:48.447Z [rum-collector]    ERROR JS error: ReferenceError: React is not defined at vendors.chunk.js:1:12
2026-05-24T09:15:48.891Z [rum-collector]    ERROR JS error: TypeError: Cannot read properties of undefined (reading 'mount') — user_id=usr_2234 session=s_8812
2026-05-24T09:15:49.001Z [rum-collector]    ERROR White screen detected: app failed to initialize — 0 React roots mounted
2026-05-24T09:15:49.112Z [rum-collector]    ERROR White screen detected — user_id=usr_4421 session=s_9023
2026-05-24T09:15:49.334Z [rum-collector]    ERROR White screen detected — user_id=usr_7731 session=s_7441
2026-05-24T09:15:50.001Z [synthetic-monitor] ERROR Synthetic check FAILED: app-load-us-east (step: wait_for_react_root) — timeout 15s
2026-05-24T09:15:50.334Z [synthetic-monitor] ERROR Synthetic check FAILED: checkout-flow-us-east (step: page_load) — 0 assets loaded
2026-05-24T09:15:51.001Z [cdn-edge-us-east-2] WARN  Elevated miss rate: 34.1% (baseline 8.8%) — failover traffic from us-east-1?
2026-05-24T09:15:51.334Z [cdn-edge-us-east-2] WARN  Origin pull queue depth: 2847 requests pending
2026-05-24T09:15:52.001Z [cdn-edge-us-east-2] ERROR Origin fetch timeout: GET /static/js/main.chunk.js — failover edge also degraded
2026-05-24T09:15:53.334Z [alerting]         CRIT  P1: CDN asset failure rate 89% in us-east — frontend unreachable
2026-05-24T09:15:54.001Z [cdn-control-plane] INFO  Initiating emergency cache purge + origin bypass for *.chunk.js *.chunk.css
2026-05-24T09:15:55.112Z [cdn-control-plane] INFO  Rerouting us-east-1 traffic → us-west-2 edge (healthy, cache hit: 88.1%)
2026-05-24T09:16:01.334Z [rum-collector]    INFO  React root mounted successfully — user_id=usr_2291 (us-west-2 path)
2026-05-24T09:16:02.001Z [cdn-edge-us-east-1] INFO  BGP route restored — AS7922 latency normalizing: 340ms → 89ms
2026-05-24T09:16:08.334Z [synthetic-monitor] INFO  Synthetic check PASSED: app-load-us-east — recovery confirmed
`,
  },
]

// Pre-computed fallback for Scenario A (used when API times out)
export const SCENARIO_A_FALLBACK = {
  summary: "Redis primary ran out of memory, causing key eviction and connection pool exhaustion across all API gateways, triggering a full P1 503 outage that cascaded into a secondary Postgres connection saturation event after failover.",
  timeline: [
    { time: "03:41:02", event: "Redis memory at 97.5% (7.8GB/8GB) — system near capacity" },
    { time: "03:41:15", event: "LRU eviction policy triggers — Redis begins evicting active session keys" },
    { time: "03:41:18", event: "Cache thrashing detected: 2,847 keys evicted in 10s" },
    { time: "03:41:22", event: "API gateway Redis GET latency hits p99=2340ms — circuit breaker at 60%" },
    { time: "03:41:23", event: "Connection pool saturation: 48-49/50 connections blocked" },
    { time: "03:41:25", event: "Session service begins timing out — REDIS_TIMEOUT on all key reads" },
    { time: "03:41:26", event: "All three API gateways return 504 upstream timeouts" },
    { time: "03:41:27", event: "API gateways begin issuing HTTP 503 — downstream failure threshold >80%" },
    { time: "03:41:29", event: "P1 incident triggered: API 503 rate >50% across all regions" },
    { time: "03:41:31", event: "Redis OOM killer fires — redis-primary-1 process terminated" },
    { time: "03:41:32", event: "Sentinel promotes redis-replica-2 to primary" },
    { time: "03:41:42", event: "Cache cold: replica-2 hit rate 2.1% vs 94.3% baseline" },
    { time: "03:41:44", event: "Cache miss storm: 4,200 req/s hitting Postgres (10x baseline)" },
    { time: "03:42:01", event: "Postgres connection limit reached (498/500) — secondary cascade begins" },
  ],
  hypotheses: [
    {
      title: "Redis OOM due to unbounded memory growth",
      strength: "HIGH",
      explanation: "Redis hit its 8GB maxmemory limit causing the OOM killer to terminate the process; LRU eviction could not keep pace with write load, leading to connection pool starvation in all API gateways.",
      evidence: [
        "03:41:02 — Memory usage: 7.8GB / 8.0GB (97.5%)",
        "03:41:18 — evicted_keys delta=2847 in last 10s — cache thrashing detected",
        "03:41:31 — Out of memory: Kill process or sacrifice child",
        "03:41:23 — Redis connection pool: 48/50 connections blocked waiting (timeout=3000ms)",
      ]
    },
    {
      title: "Session service design: no circuit breaker before Redis",
      strength: "MED",
      explanation: "Session service had no independent circuit breaker and failed synchronously on every Redis timeout rather than failing fast, amplifying pressure on the connection pool.",
      evidence: [
        "03:41:25 — Failed to read session token: REDIS_TIMEOUT after 3001ms key=sess:u:8823941",
        "03:41:25 — Failed to read session token: REDIS_TIMEOUT after 3002ms key=sess:u:9012334",
        "03:41:25 — Failed to read session token: REDIS_TIMEOUT after 3000ms key=sess:u:7741029",
      ]
    },
    {
      title: "No cache warming on Redis failover",
      strength: "MED",
      explanation: "After sentinel promoted the replica, no cache warming step ran, causing a cold-start miss storm that immediately exhausted Postgres connections as a secondary failure.",
      evidence: [
        "03:41:42 — Cold cache detected — replica-2 hit rate 2.1% (was 94.3%)",
        "03:41:44 — Cache miss storm: 4200 req/s hitting DB directly (baseline: 420)",
        "03:42:01 — too many connections: 498/500 (max_connections=500)",
      ]
    }
  ],
  fixSteps: [
    "Immediately: redis-cli -h redis-replica-2 CONFIG SET maxmemory-policy noeviction and set maxmemory to 90% of available RAM to prevent silent key loss",
    "redis-cli -h redis-replica-2 INFO memory — confirm current usage and headroom before re-enabling traffic",
    "Drain and restart API gateway connection pools: kubectl rollout restart deployment/api-gateway to clear stale Redis connections",
    "Run cache warmer job before opening traffic: kubectl create job cache-warm --from=cronjob/cache-warmer",
    "Raise Postgres max_connections from 500 to 1000 or deploy PgBouncer as connection pooler to prevent secondary cascade",
    "Add Redis memory alerting at 70% and 85% thresholds in Prometheus: redis_memory_used_bytes / redis_memory_max_bytes",
    "Post-incident: investigate root cause of memory growth spike (leak? traffic surge? large key write?). Run redis-cli --bigkeys and redis-cli MEMORY DOCTOR",
  ]
}
