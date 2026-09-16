# Verification

**English** | [繁體中文](../zh-TW/verification.md) | [README](../../README.md)

## Source-import evidence — 2026-09-16 UTC

Imported from `framepocket-0.1.0-bilingual-source.zip`. Its SHA-256, the documentation-only base commit, runtime and fresh local results are recorded in [local-tests.json](../local-tests.json). The archive's 74 inherited tests passed before fixes; 76 tests pass after adding concurrency and conflicting-canonical regression tests. Run `npm test` and `npm run check` from the repository root.

The source includes the Node API, static Traditional Chinese UI, configuration example, Docker/Compose files, CI and a manual Pages workflow. Import is not a deployment. GitHub CI results must be read on the PR; local passes are not remote CI evidence.

| Check | This import's result |
| --- | --- |
| Node unit/local HTTP and repository tests | 76 passed, 0 failed/skipped; Node v24.19.0 |
| JavaScript syntax | Passed |
| Default `npm start`, health, static assets, missing-engine error | Passed on loopback; no external media requests |
| Node 22/24 CI | Workflow added; inspect the PR for actual results |
| Docker build/runtime | Local attempt unavailable: Docker executable absent; Compose smoke job added to CI |
| Browser smoke | Could not run: Chromium absent; installation timed out / returned HTTP 502 |
| Live Instagram / deployed Cobalt | Not tested |
| Live Threads extraction/download | Not tested |
| Real iPhone/Android saving | Not tested |
| Pages/public API deployment | Not performed |
| Independent security/legal audit | Not performed |

Parser tests use invented post IDs and synthetic Cobalt/HTML responses. Local HTTP tests start a loopback server with mock resolvers/media; bytes labelled `video/mp4` are not a playable-video test. New regressions verify that delayed request bodies cannot exceed two active resolvers and that conflicting canonical/OG post identities fail closed. Repository checks cover attribution, bilingual documents, relative links and manual static-only Pages scope.

Historical browser layout checks are not evidence for this import. No fresh browser, mobile layout, playable-media or real-device pass is claimed. The Docker CI smoke job checks container startup, health and frontend serving only; it does not run Cobalt or establish platform compatibility.

## Before claiming live compatibility

Test owned/permitted Instagram photo, Reel and mixed carousel; permitted Threads single/multiple-video and no-video posts; blocked/login-required/deleted/429 responses; MIME/actual content/size/duration; completed browser saves; expired tickets, limits, CORS and TLS. Record host region, UTC time, tested commit, exact Cobalt version and real device/browser. Never commit private URLs, cookies, keys or downloaded content as evidence.

Public source, merged PR, successful CI, deployed frontend and successful real downloads are separate milestones. Keep untested combinations labelled unverified.
