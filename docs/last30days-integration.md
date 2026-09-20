# last30days integration spike

Status: code-level proof of concept only. This branch does not expose a public API route or UI yet.

## Why it fits

DL Anything You Want already has a Node.js research path for profile scanning, selected-post analysis, GitHub enrichment, and optional LLM summaries. The upstream `mvanhorn/last30days-skill` project now exposes a versioned machine-readable agent JSON contract, so the clean integration boundary is its CLI JSON output rather than copying its agent prompt into this app.

Bridge flow:

```
web UI
  -> DL Anything You Want Node API
  -> lib/last30days-bridge.mjs
  -> python3.12 .../last30days.py "<topic>" --emit=json --json-profile=agent
  -> validate schema 1.x
  -> normalized JSON
  -> results / clusters / source-status UI
```

The bridge intentionally uses `spawn(..., {shell:false})`. User topics are passed as one argv value instead of interpolated into a shell command.

## Runtime blocker found in the current image

The current app image is based on `node:22-bookworm-slim` and installs Debian `python3`. The current last30days v3 engine enforces Python 3.12+.

Do not silently replace the existing app's Python runtime just to make the spike work. Preferred production design is an optional Python 3.12 sidecar/gateway, or a separately pinned last30days runtime mounted into the app.

## Proposed production API

`POST /api/research/topic`

Example request:

```json
{
  "topic": "AI coding agents",
  "sources": ["reddit", "github", "youtube"]
}
```

Example response shape is the upstream agent contract with a local `provider: "last30days"` wrapper. Keep upstream `source_status` intact so rate limits, auth failures, timeouts, and clean no-result states are distinguishable.

## Configuration

Suggested server-only variables:

```
LAST30DAYS_ENABLED=0
LAST30DAYS_PYTHON=python3.12
LAST30DAYS_SCRIPT=/opt/last30days/skills/last30days/scripts/last30days.py
```

Provider/API secrets should remain server-side and be passed through the process environment. They must never be returned by `/api/health` or embedded in `web/config.js`.

## Next production step

Add a Python 3.12 sidecar pinned to an upstream commit/release, then add:

- `POST /api/research/topic` with the existing origin/rate-limit/concurrency controls.
- A third UI mode: Download / Profile Research / Topic Research.
- Result cards for clusters and evidence, native engagement, relevance score, publication time, and per-source status.
- Optional discovery mode later using the separate upstream discovery JSON contract.

Upstream: https://github.com/mvanhorn/last30days-skill
Machine JSON contract: https://github.com/mvanhorn/last30days-skill/blob/main/docs/reference/json-export.md
