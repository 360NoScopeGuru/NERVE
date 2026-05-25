<div align="center">

# ⚡ NERVE

**Incident Root Cause Analyzer**

*War-room intelligence · SRE-grade log analysis · Powered by NVIDIA Nemotron 49B*

[![Version](https://img.shields.io/badge/version-0.2.0-00d4ff?style=flat-square&labelColor=0a0a1a)](https://github.com/360NoScopeGuru/NERVE)
[![License](https://img.shields.io/badge/license-MIT-00e5a0?style=flat-square&labelColor=0a0a1a)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react&logoColor=61dafb&labelColor=0a0a1a)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=flat-square&logo=vite&logoColor=646cff&labelColor=0a0a1a)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=38bdf8&labelColor=0a0a1a)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-336791?style=flat-square&logo=postgresql&logoColor=white&labelColor=0a0a1a)](https://www.prisma.io)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6c47ff?style=flat-square&labelColor=0a0a1a)](https://clerk.com)
[![Render](https://img.shields.io/badge/Deployed-Render-46e3b7?style=flat-square&logo=render&logoColor=white&labelColor=0a0a1a)](https://nerve-ql1v.onrender.com)
[![Pages](https://img.shields.io/badge/Landing-GitHub%20Pages-222?style=flat-square&logo=github&logoColor=white&labelColor=0a0a1a)](https://360noscopeguru.github.io/NERVE)

[**Live Demo →**](https://nerve-ql1v.onrender.com) &nbsp;·&nbsp; [**Landing Page →**](https://360noscopeguru.github.io/NERVE)

</div>

---

## What is NERVE?

NERVE is a production-grade **AI-powered incident analysis platform** built for Site Reliability Engineers. Paste or drop raw log data from any system, and NERVE dispatches a 3-stage LLM pipeline (primary: NVIDIA Nemotron 49B → fallback: Llama 3.1 8B → structured JSON formatter) to produce:

- A one-sentence **root cause summary**
- A full **incident timeline** reconstructed from log timestamps
- Ranked **root cause hypotheses** with evidence lines traced directly to the input
- Concrete **remediation steps** with real commands — not generic advice
- A **severity score** (1–10) with blast-radius justification

All results are persisted per-user in PostgreSQL and retrievable from a collapsible history sidebar. The entire UI is keyboard-navigable, mobile-responsive, and ships with dark *and* light themes.

---

## Features

### Analysis Engine
| Feature | Detail |
|---|---|
| Primary model | `nvidia/llama-3.3-nemotron-super-49b-v1` via NVIDIA NIM |
| Fallback model | `meta/llama-3.1-8b-instruct` — automatic on primary timeout or signal failure |
| Formatter stage | Second pass through Llama 8B to guarantee valid structured JSON |
| Offline fallback | Curated cached results for built-in demo scenarios |
| Streaming progress | Server-Sent Events deliver real-time status to the UI during analysis |
| Input validation | Client-side check for minimum line count, timestamp patterns, and error signals before any API call |

### UI / UX
- **Terminal-aesthetic** log input with drag-and-drop file loading (`.log`, `.txt`, `.json`) and clipboard paste
- **Timeline view** — chronological event strip with animated dot-and-spine rendering
- **Hypothesis cards** — expandable, ranked by signal strength (HIGH / MED / LOW) with evidence log panel
- **Fix steps** — inline code highlighting with `backtick` extraction
- **Severity gauge** — animated SVG arc gauge, colour-coded from green to red
- **History sidebar** — collapsible desktop panel; slide-in portal drawer on mobile
- **Demo scenarios** — 3 pre-loaded real-world incident logs (Redis OOM cascade, bad deploy, custom) with tilt-card interaction
- **Dark / Light mode** — full theme switching via CSS custom properties; every colour token adapts
- **Mobile-first** — `100dvh` viewport, bottom tab bar, portaled history drawer, stacked header buttons
- **Intro splash** — animated logo that flies up into the header on first load (session-cached)
- **Magnetic run button** — cursor-tracking physics on hover

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │HistorySidebar│  │ LogInputPanel │   │  Output Panels  │  │
│  │  (Clerk JWT) │  │ (validation) │   │ Timeline / Hypo │  │
│  └──────┬───────┘  └──────┬───────┘   │ FixSteps / Gauge│  │
│         │                 │           └────────┬────────┘  │
│         └────────┬─────── ┘SSE stream           │          │
│                  │                              │          │
└──────────────────┼──────────────────────────────┼──────────┘
                   │ HTTP + Clerk JWT              │
┌──────────────────▼──────────────────────────────▼──────────┐
│                    Express Server (Node 20)                  │
│                                                             │
│   POST /api/analyze  ──►  analyzeLog()  ──►  SSE stream    │
│   GET  /api/history                                         │
│   GET  /api/history/:id                                     │
│   DELETE /api/history/:id                                   │
│                    │                                        │
│             Prisma ORM                                      │
└────────────────────┼────────────────────────────────────────┘
                     │
         ┌───────────┼─────────────┐
         ▼           ▼             ▼
   PostgreSQL   NVIDIA NIM     Clerk API
   (Render DB)  (Nemotron 49B  (auth tokens)
                 + Llama 8B)
```

### LLM Pipeline (3 stages)

```
User log input
      │
      ▼
┌─────────────────────────────────────────────┐
│ Stage 1 — Primary Analysis (35s timeout)    │
│ Model: nvidia/llama-3.3-nemotron-super-49b  │
│                                             │
│  ► Structured free-text analysis            │
│  ► Signal check: must contain TIMELINE +    │
│    HYPOTHESES keywords and length > 80 chars│
└───────────────────┬─────────────────────────┘
                    │ fail / timeout
                    ▼
┌─────────────────────────────────────────────┐
│ Stage 2 — Fallback Analysis (20s timeout)   │
│ Model: meta/llama-3.1-8b-instruct           │
│                                             │
│  ► Same prompt, smaller model               │
│  ► Same signal check                        │
└───────────────────┬─────────────────────────┘
                    │ fail / timeout
                    ▼
           Cached result (if scenario)
           or hard error
                    │
         Stage 1 or 2 succeeded
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ Stage 3 — JSON Formatter (20s, 4096 tokens) │
│ Model: meta/llama-3.1-8b-instruct           │
│                                             │
│  ► Converts free-text to strict JSON schema │
│  ► Validates: summary, timeline[], hypo[],  │
│    fixSteps[], severityScore 1–10           │
│  ► Falls back to regex text parser on fail  │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
            Normalised result
        → saved to PostgreSQL
        → SSE result event to client
```

---

## Project Structure

```
nerve/
├── server/
│   ├── index.js                 # Express app, CORS, Clerk middleware, SPA fallback
│   ├── routes/
│   │   └── analysis.js          # All /api/* route handlers
│   └── lib/
│       ├── analyzeLog.js        # 3-stage LLM pipeline orchestrator
│       ├── systemPrompt.js      # NERVE system prompt (SRE persona + output schema)
│       ├── responseParser.js    # Regex fallback text parser for unstructured LLM output
│       └── fixtures.js          # Cached fallback results for demo scenarios
│
├── src/
│   ├── App.jsx                  # Root component: SignInScreen + Analyzer
│   ├── index.css                # CSS custom properties, dark/light theme tokens, overlays
│   ├── components/
│   │   ├── AnalysisEngine.jsx   # Client-side SSE consumer, status parsing
│   │   ├── LogInputPanel.jsx    # Textarea, file drop, clipboard paste, run button
│   │   ├── ScenarioLoader.jsx   # Demo scenario cards with 3D tilt interaction
│   │   ├── TimelineView.jsx     # Dot-and-spine timeline with animated entry
│   │   ├── HypothesisCard.jsx   # Expandable cards with signal bars and evidence log
│   │   ├── FixSteps.jsx         # Remediation step list with inline code highlighting
│   │   └── HistorySidebar.jsx   # Collapsible sidebar + mobile portal drawer
│   ├── constants/
│   │   └── fixtures.js          # Built-in scenario definitions and log samples
│   └── utils/
│       └── logValidator.js      # Client-side pre-flight validation (timestamps, signals)
│
├── prisma/
│   └── schema.prisma            # PostgreSQL schema (Analysis model)
│
├── Dockerfile                   # Multi-stage build (Node 20 Alpine)
├── render.yaml                  # Render infrastructure-as-code (web service + DB)
├── vite.config.js
├── tailwind.config.js           # Custom nerve-* colour tokens + animation keyframes
└── package.json
```

---

## API Reference

All endpoints require a valid **Clerk JWT** in the `Authorization: Bearer <token>` header. The token is scoped per-user — users can only read, delete, or list their own analyses.

### `POST /api/analyze`

Triggers a full LLM analysis. Returns a **Server-Sent Events** stream.

**Request body**
```json
{
  "logData": "string (required) — raw log text, max 2 MB",
  "scenarioId": "string (optional) — used to match a cached fallback"
}
```

**SSE event types**

| `type` | Payload | Description |
|---|---|---|
| `status` | `{ text: string }` | Progress update — model stage name |
| `result` | `{ result: AnalysisResult, fromCache: boolean }` | Final structured result |
| `error` | `{ message: string }` | All models failed; no cache available |

**`AnalysisResult` schema**
```json
{
  "summary":       "string",
  "timeline":      [{ "time": "string", "event": "string" }],
  "hypotheses":    [{
    "title":       "string",
    "strength":    "HIGH | MED | LOW",
    "explanation": "string",
    "evidence":    ["string"]
  }],
  "fixSteps":      ["string"],
  "severityScore": 1,
  "severityReason":"string",
  "raw":           "string (raw LLM output before formatting)"
}
```

---

### `GET /api/history`

Returns the 50 most recent analyses for the authenticated user, ordered newest-first.

**Response** `200 OK`
```json
[
  {
    "id":            "cuid",
    "scenarioId":    "A | B | null",
    "inputSnippet":  "first 200 chars of log input",
    "summary":       "string",
    "severityScore": 8,
    "fromCache":     false,
    "createdAt":     "ISO 8601"
  }
]
```

---

### `GET /api/history/:id`

Returns the full record including the complete `result` JSON and original `logData`.

**Response** `200 OK` — full `Analysis` row as JSON, or `404` if not found / belongs to another user.

---

### `DELETE /api/history/:id`

Permanently deletes the analysis. Scoped to the authenticated user — cannot delete other users' records.

**Response** `200 OK` `{ "ok": true }`

---

## Data Model

```prisma
model Analysis {
  id            String   @id @default(cuid())
  userId        String                          // Clerk user ID
  scenarioId    String?                         // "A", "B", etc. — null for custom input
  inputSnippet  String                          // First 200 chars, shown in sidebar
  logData       String?                         // Full input — restored on history load
  summary       String                          // One-line root cause
  severityScore Int?                            // 1–10, null if formatter failed
  result        Json                            // Full AnalysisResult blob
  fromCache     Boolean  @default(false)
  createdAt     DateTime @default(now())

  @@index([userId, createdAt(sort: Desc)])
}
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NVIDIA_API_KEY` | ✅ | NVIDIA NIM API key — must start with `nvapi-` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Prisma format) |
| `CLERK_SECRET_KEY` | ✅ | Clerk backend secret key |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key — baked into the frontend bundle at build time |
| `NODE_ENV` | — | Set to `production` to enable SPA static serving from Express |
| `PORT` | — | Server port, defaults to `3001` |

> **Security note:** `VITE_CLERK_PUBLISHABLE_KEY` is a build-time `ARG` in the Dockerfile. It is embedded in the client bundle and is safe to expose — it is not a secret. The `CLERK_SECRET_KEY` never leaves the server.

---

## Getting Started (Local Dev)

### Prerequisites
- Node.js 20+
- PostgreSQL (local or cloud)
- NVIDIA NIM API key ([get one free](https://build.nvidia.com))
- Clerk application ([free tier](https://clerk.com))

### 1. Clone and install

```bash
git clone https://github.com/360NoScopeGuru/NERVE.git
cd NERVE
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://user:password@localhost:5432/nerve
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
```

### 3. Set up the database

```bash
npx prisma db push
```

This creates the `Analysis` table and index. No migration files needed — `db push` is used for schema-push workflows.

### 4. Run in development

Two processes are needed: the Vite dev server (frontend) and the Express server (API).

```bash
# Terminal 1 — frontend
npm run dev
# → http://localhost:5173

# Terminal 2 — API server
npm run server
# → http://localhost:3001
```

Vite's dev proxy is **not** configured by default — the frontend hits `http://localhost:3001` directly. CORS is explicitly allowed for `http://localhost:5173` in development mode.

### 5. Validate your setup

Open `http://localhost:5173`, sign in via Clerk, load **Scenario A (Redis OOM)**, and click **RUN NERVE**. You should see the three-stage status stream and a full analysis result within ~30 seconds.

---

## Log Input Format

NERVE validates input client-side before sending to the API. Logs must meet all three criteria:

| Requirement | Accepted patterns |
|---|---|
| Minimum 10 non-empty lines | — |
| At least one timestamp | ISO 8601, `YYYY/MM/DD HH:MM:SS`, syslog, `HH:MM:SS.mmm`, `[YYYY-MM-DD` |
| At least one error signal | `ERROR`, `WARN`, `WARNING`, `timeout`, `failed`, `exception`, `fatal`, `critical`, `panic`, `killed`, `500`, `503`, `refused` |

Supported file types for drag-and-drop upload: `.log`, `.txt`, `.json`

---

## Deployment (Render)

The repo includes `render.yaml` for one-click infrastructure deployment on [Render](https://render.com).

```bash
# Connect your GitHub repo to Render, then:
render deploy
```

The `render.yaml` provisions:
- A **PostgreSQL database** (free tier, `nerve-db`)
- A **Docker web service** built from `Dockerfile`

The multi-stage `Dockerfile`:
1. **Builder stage** — installs all deps, generates Prisma client, runs `vite build` with `VITE_CLERK_PUBLISHABLE_KEY` baked in as a build arg
2. **Runtime stage** — copies only production deps, server code, and built `dist/`; runs `prisma db push` on startup then starts Express

Set the following environment variables in the Render dashboard (they are marked `sync: false` in `render.yaml` so they are never committed):

- `NVIDIA_API_KEY`
- `CLERK_SECRET_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`

`DATABASE_URL` is injected automatically from the linked Render database.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18.3 + Vite 6 |
| Styling | Tailwind CSS 3.4 with CSS custom property theme tokens |
| Auth (frontend) | `@clerk/clerk-react` v5 |
| Auth (backend) | `@clerk/express` v1 — `requireAuth()` middleware |
| Backend | Express 4.18 on Node 20 |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| LLM API | NVIDIA NIM (`integrate.api.nvidia.com`) |
| Primary model | `nvidia/llama-3.3-nemotron-super-49b-v1` |
| Fallback model | `meta/llama-3.1-8b-instruct` |
| Containerisation | Docker (multi-stage, `node:20-alpine`) |
| Deployment | Render (Docker web service + managed PostgreSQL) |

---

## Theme System

NERVE uses a fully CSS-variable-driven theme system. All colour tokens live in `:root` (dark, default) and `[data-theme="light"]` blocks in `index.css`. Every component uses `rgb(var(--c-*))` references — no hardcoded hex values anywhere in the UI.

| Token | Dark | Light | Purpose |
|---|---|---|---|
| `--c-bg` | `4 4 14` | `238 238 248` | Page background |
| `--c-panel` | `8 8 24` | `252 252 255` | Card / panel surfaces |
| `--c-panel-raised` | `13 13 34` | `244 244 252` | Elevated elements |
| `--c-border` | `20 20 40` | `210 210 228` | Default borders |
| `--c-border-bright` | `30 30 64` | `175 175 205` | Highlighted borders |
| `--c-accent` | `0 212 255` | `0 112 200` | Primary interactive colour |
| `--c-critical` | `255 42 42` | `196 22 22` | High-severity / errors |
| `--c-warn` | `245 158 11` | `168 105 0` | Warnings |
| `--c-success` | `0 229 160` | `0 132 74` | Success / low severity |
| `--c-text` | `221 228 240` | `18 18 40` | Primary text |
| `--c-text-dim` | `172 172 204` | `62 62 98` | Secondary text |
| `--c-muted` | `46 46 80` | `145 145 175` | Muted / placeholder |

Theme is toggled by setting `document.documentElement.dataset.theme = 'light' | 'dark'`.

---

## Input Validation

Client-side validation (`src/utils/logValidator.js`) runs synchronously before any network call. Errors are shown inline below the terminal and the run button stays disabled until all checks pass.

```
validateLogs(text) → { valid: boolean, errors: string[] }
```

Timestamp patterns matched (any one required):
- ISO 8601: `2026-05-24T03:41:02`
- Slash date: `2026/05/24 03:41:02`
- Syslog: `May 24 03:41:02`
- Millisecond: `03:41:02.113`
- Bracketed: `[2026-05-24`

Error signal keywords (case-insensitive, any one required):
`ERROR` · `WARN` · `WARNING` · `timeout` · `failed` · `exception` · `fatal` · `critical` · `panic` · `killed` · `503` · `500` · `refused`

---

## License

MIT © 2026 [360NoScopeGuru](https://github.com/360NoScopeGuru)

---

<div align="center">

Built with obsessive attention to terminal aesthetics and zero tolerance for 503s.

</div>
