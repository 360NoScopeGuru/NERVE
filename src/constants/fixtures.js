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
    logs: `2026-05-24T03:11:02Z [deployment-service] INFO Deploy initiated: payments-api v2.4.1 -> v2.4.2 by ci-bot
2026-05-24T03:11:09Z [deployment-service] INFO Rolling update started: 3/6 pods replaced
2026-05-24T03:11:14Z [deployment-service] INFO Rolling update started: 6/6 pods replaced
2026-05-24T03:11:15Z [payments-api] INFO Service restarted on new build v2.4.2
2026-05-24T03:11:16Z [payments-api] WARN Config loaded: db.pool.max_connections=5 (was 50)
2026-05-24T03:11:20Z [payments-api] INFO Accepting traffic
2026-05-24T03:11:23Z [payments-api] WARN DB connection pool near limit: 4/5 connections active
2026-05-24T03:11:25Z [payments-api] ERROR DB connection pool exhausted: timeout acquiring connection after 3002ms
2026-05-24T03:11:25Z [payments-api] ERROR Payment transaction failed: unable to acquire DB connection [txn_id=8821a]
2026-05-24T03:11:26Z [payments-api] ERROR Payment transaction failed: unable to acquire DB connection [txn_id=8822b]
2026-05-24T03:11:26Z [payments-api] ERROR Payment transaction failed: unable to acquire DB connection [txn_id=8823c]
2026-05-24T03:11:27Z [postgres-primary] WARN Idle connection count dropped to 0 — all slots occupied
2026-05-24T03:11:27Z [postgres-primary] ERROR max_connections limit approaching: 98/100 connections active
2026-05-24T03:11:28Z [payments-api] ERROR DB connection pool exhausted: timeout acquiring connection after 3001ms
2026-05-24T03:11:28Z [payments-api] ERROR Payment transaction failed: unable to acquire DB connection [txn_id=8824d]
2026-05-24T03:11:29Z [load-balancer] WARN Upstream payments-api response time: 4821ms (threshold: 2000ms)
2026-05-24T03:11:30Z [checkout-service] ERROR Dependency timeout: payments-api did not respond within 5000ms
2026-05-24T03:11:30Z [checkout-service] ERROR Order failed at payment step [order_id=ORD-99123]
2026-05-24T03:11:31Z [checkout-service] ERROR Order failed at payment step [order_id=ORD-99124]
2026-05-24T03:11:31Z [checkout-service] ERROR Order failed at payment step [order_id=ORD-99125]
2026-05-24T03:11:32Z [alerting] CRITICAL Payment success rate dropped to 3% (baseline: 99.1%)
2026-05-24T03:11:32Z [alerting] CRITICAL PagerDuty alert fired: PAYMENTS_DOWN P1
2026-05-24T03:11:33Z [payments-api] ERROR DB connection pool exhausted: timeout acquiring connection after 3005ms
2026-05-24T03:11:34Z [postgres-primary] ERROR FATAL: remaining connection slots reserved for non-replication superuser
2026-05-24T03:11:35Z [checkout-service] ERROR Order failed at payment step [order_id=ORD-99126]
2026-05-24T03:11:36Z [load-balancer] ERROR Upstream payments-api health check failed: HTTP 503
2026-05-24T03:11:36Z [load-balancer] WARN Removing payments-api pod payments-api-7d9f from rotation
2026-05-24T03:11:40Z [deployment-service] WARN Rollback triggered for payments-api v2.4.2 -> v2.4.1
2026-05-24T03:11:47Z [deployment-service] INFO Rollback complete: payments-api v2.4.1 restored
2026-05-24T03:11:49Z [payments-api] INFO Config loaded: db.pool.max_connections=50 (restored)
2026-05-24T03:11:52Z [postgres-primary] INFO Connection count normalizing: 41/100 active
2026-05-24T03:11:55Z [payments-api] INFO Payment transactions resuming normally
2026-05-24T03:12:01Z [alerting] INFO Payment success rate recovered to 97.4%
`,
  },
  {
    id: 'C',
    label: 'Scenario C',
    title: 'CDN Degradation → Frontend Crash',
    description: 'CDN edge degradation causing asset failures and JS crash',
    logs: `2026-05-24T14:22:01Z [cdn-health-monitor] WARN Elevated latency detected on cdn-edge-eu-west-2: p99=4200ms (baseline: 180ms)
2026-05-24T14:22:04Z [cdn-health-monitor] WARN Packet loss on cdn-edge-eu-west-2: 18% (threshold: 2%)
2026-05-24T14:22:07Z [cdn-health-monitor] ERROR cdn-edge-eu-west-2 health check failed: connection timeout
2026-05-24T14:22:09Z [frontend-server] WARN Static asset fetch timeout: /static/js/main.chunk.js (cdn-edge-eu-west-2) 5001ms
2026-05-24T14:22:09Z [frontend-server] WARN Static asset fetch timeout: /static/css/main.chunk.css (cdn-edge-eu-west-2) 5003ms
2026-05-24T14:22:10Z [frontend-server] ERROR Failed to load critical asset: /static/js/vendor.chunk.js — CDN returned HTTP 524
2026-05-24T14:22:10Z [frontend-server] ERROR Failed to load critical asset: /static/js/main.chunk.js — CDN returned HTTP 524
2026-05-24T14:22:11Z [browser-error-tracker] ERROR Uncaught TypeError: Cannot read properties of undefined (reading 'init') — main.chunk.js failed to load
2026-05-24T14:22:11Z [browser-error-tracker] ERROR React render failed: ChunkLoadError — loading chunk 12 failed
2026-05-24T14:22:11Z [browser-error-tracker] ERROR React render failed: ChunkLoadError — loading chunk 7 failed
2026-05-24T14:22:12Z [browser-error-tracker] CRITICAL White screen reported by 847 active sessions in eu-west region
2026-05-24T14:22:13Z [frontend-server] ERROR Asset CDN fallback to origin triggered for: /static/js/main.chunk.js
2026-05-24T14:22:13Z [frontend-server] ERROR Asset CDN fallback to origin triggered for: /static/js/vendor.chunk.js
2026-05-24T14:22:14Z [origin-server] WARN Unexpected direct asset traffic spike: 2400 req/s (normal CDN-served baseline: 12 req/s)
2026-05-24T14:22:15Z [origin-server] WARN CPU utilization: 94% (threshold: 80%) — origin not sized for direct traffic
2026-05-24T14:22:16Z [cdn-health-monitor] ERROR cdn-edge-eu-west-2 marked DEGRADED — failover to cdn-edge-eu-central-1 initiated
2026-05-24T14:22:17Z [browser-error-tracker] CRITICAL Error rate: 94% of page loads in eu-west failing with ChunkLoadError
2026-05-24T14:22:18Z [frontend-server] WARN CDN failover in progress — asset availability partial during transition
2026-05-24T14:22:19Z [origin-server] ERROR HTTP 503 responses started: origin overloaded by direct traffic fallback
2026-05-24T14:22:20Z [browser-error-tracker] CRITICAL White screen count: 3,412 sessions — eu-west region fully impacted
2026-05-24T14:22:21Z [alerting] CRITICAL PagerDuty alert fired: FRONTEND_DOWN_EU_WEST P1
2026-05-24T14:22:22Z [cdn-health-monitor] WARN cdn-edge-eu-central-1 absorbing failover traffic — latency elevated: p99=820ms
2026-05-24T14:22:28Z [cdn-health-monitor] INFO Failover to cdn-edge-eu-central-1 complete
2026-05-24T14:22:30Z [frontend-server] INFO Assets now loading from cdn-edge-eu-central-1
2026-05-24T14:22:33Z [origin-server] INFO Direct traffic normalizing: 180 req/s — CDN failover absorbing load
2026-05-24T14:22:35Z [browser-error-tracker] INFO Error rate dropping: 41% of page loads failing (recovering)
2026-05-24T14:22:40Z [browser-error-tracker] INFO Error rate: 8% — recovery in progress
2026-05-24T14:22:45Z [alerting] INFO FRONTEND_DOWN_EU_WEST resolving — error rate 2.1%
2026-05-24T14:22:50Z [browser-error-tracker] INFO Page load success rate restored: 98.7% in eu-west region
`,
  },
]

// Pre-computed fallback for Scenario B (used when API times out)
export const SCENARIO_B_FALLBACK = {
  summary: "A misconfigured db.pool.max_connections (5 instead of 50) shipped in payments-api v2.4.2 exhausted the DB connection pool within seconds of deployment, causing payment failures and a P1 alert; rollback to v2.4.1 restored service in under 60 seconds.",
  timeline: [
    { time: "03:11:02", event: "Deploy initiated: payments-api v2.4.1 → v2.4.2 by ci-bot" },
    { time: "03:11:09", event: "Rolling update started: 3/6 pods replaced" },
    { time: "03:11:14", event: "Rolling update complete: 6/6 pods replaced" },
    { time: "03:11:15", event: "payments-api v2.4.2 restarts on all pods" },
    { time: "03:11:16", event: "WARN: db.pool.max_connections=5 loaded — down from 50 in v2.4.1" },
    { time: "03:11:20", event: "Service begins accepting traffic" },
    { time: "03:11:23", event: "DB pool near limit: 4/5 connections active under normal traffic" },
    { time: "03:11:25", event: "Pool exhausted — first payment transactions fail" },
    { time: "03:11:27", event: "Postgres: idle connections hit 0, all slots occupied" },
    { time: "03:11:29", event: "Load balancer: payments-api response time 4821ms (threshold: 2000ms)" },
    { time: "03:11:30", event: "checkout-service dependency timeouts — orders failing at payment step" },
    { time: "03:11:32", event: "P1 alert fired: payment success rate 3% (baseline: 99.1%)" },
    { time: "03:11:36", event: "Load balancer removes degraded pod payments-api-7d9f from rotation" },
    { time: "03:11:40", event: "Rollback triggered: v2.4.2 → v2.4.1" },
    { time: "03:11:47", event: "Rollback complete: v2.4.1 fully restored" },
    { time: "03:11:49", event: "db.pool.max_connections=50 confirmed restored" },
    { time: "03:11:55", event: "Payment transactions resuming normally" },
    { time: "03:12:01", event: "Success rate recovered to 97.4% — incident resolving" },
  ],
  hypotheses: [
    {
      title: "Misconfigured db.pool.max_connections in v2.4.2 deploy",
      strength: "HIGH",
      explanation: "A config regression in v2.4.2 set db.pool.max_connections to 5 (from 50), causing the pool to exhaust within 3 seconds of receiving normal traffic — the rollback immediately confirmed this as root cause by restoring the correct value.",
      evidence: [
        "03:11:16 [payments-api] WARN Config loaded: db.pool.max_connections=5 (was 50)",
        "03:11:23 [payments-api] WARN DB connection pool near limit: 4/5 connections active",
        "03:11:25 [payments-api] ERROR DB connection pool exhausted: timeout acquiring connection after 3002ms",
        "03:11:49 [payments-api] INFO Config loaded: db.pool.max_connections=50 (restored)",
      ],
    },
    {
      title: "No config validation gate in the deploy pipeline",
      strength: "MED",
      explanation: "The deployment pipeline had no pre-flight check on critical config values, allowing a 10x regression in pool size to reach production without any automated signal.",
      evidence: [
        "03:11:02 [deployment-service] INFO Deploy initiated: payments-api v2.4.1 -> v2.4.2 by ci-bot",
        "03:11:16 [payments-api] WARN Config loaded: db.pool.max_connections=5 (was 50)",
        "03:11:40 [deployment-service] WARN Rollback triggered for payments-api v2.4.2 -> v2.4.1",
      ],
    },
    {
      title: "checkout-service lacks circuit breaker on payments-api",
      strength: "LOW",
      explanation: "checkout-service continued firing requests at payments-api after pool exhaustion rather than tripping a circuit breaker, amplifying order failure count during the incident window.",
      evidence: [
        "03:11:30 [checkout-service] ERROR Order failed at payment step [order_id=ORD-99123]",
        "03:11:31 [checkout-service] ERROR Order failed at payment step [order_id=ORD-99124]",
        "03:11:35 [checkout-service] ERROR Order failed at payment step [order_id=ORD-99126]",
      ],
    },
  ],
  fixSteps: [
    "Rollback already applied: `kubectl rollout undo deployment/payments-api` — verify v2.4.1 is stable before proceeding",
    "Audit the config diff: `git diff v2.4.1..v2.4.2 -- config/` — identify where max_connections=5 was introduced and by whom",
    "Fix v2.4.2 config to restore db.pool.max_connections=50 and add a config schema test that asserts pool size >= 20",
    "Add a pre-deploy CI gate: parse the rendered config and assert critical numeric values are within safe bounds before rollout begins",
    "Add Prometheus alert: `payments_api_db_pool_active / payments_api_db_pool_max > 0.8` → page on-call before pool exhausts",
    "Implement a circuit breaker in checkout-service for the payments-api dependency (e.g. resilience4j or Hystrix) to shed load automatically during future payment degradation",
  ],
}

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
