# Verification

**English** | [繁體中文](../zh-TW/verification.md) | [README](../../README.md)

> **Documentation stage: runnable source has not yet been imported.** Technical/deployment details describe the separately prepared source package, not code or a live service present on this branch.

Release preparation: 2026-09-15 America/Toronto (runtime timestamps may be 2026-09-16 UTC).

## Recorded scope

The inherited 69 Node unit/local-HTTP tests were rerun successfully before editing. The separately prepared source package adds five repository/documentation checks; final local results are recorded in [local-tests.json](../local-tests.json). After obtaining the source package, run `npm test` and `npm run check` to reproduce. No executable tests or CI workflows are included in this documentation-only PR. A local pass is not a remote CI result.

Parser tests use invented post IDs and synthetic Cobalt/HTML responses. Local HTTP tests start a real loopback server but inject mock media/resolvers; test bytes labeled `video/mp4` are not a playable-video test. Source-package repository checks cover package/notice consistency, documentation pairs/relative links and static-only manual Pages scope.

Earlier offline browser layout checks are part of the original prototype history, not newly rerun evidence for this change. Screenshots/browser reports from that historical package are not bundled here and no new browser/device pass is claimed.

| Work | Status |
| --- | --- |
| Prepared source: Node unit/local HTTP + repository checks | See local result file |
| Prepared source: JavaScript syntax | See local result file |
| This documentation PR's relative Markdown links | 86 checked locally |
| Live Instagram / deployed Cobalt | Not tested |
| Live Threads extraction/download | Not tested |
| Browser regression after the new GitHub nav link | Not tested |
| Docker build/runtime | Not tested |
| Real iPhone/Android saving | Not tested |
| Pages/public API operation | Not verified by this documentation change |
| Independent security/legal audit | Not performed |

## Before calling the service live

Test owned/permitted Instagram photo, Reel and mixed carousel; permitted Threads single/multiple-video and no-video posts; blocked/login-required/deleted/429 responses; MIME/actual content/size/duration; completed browser saves; expired tickets, limits, CORS and TLS. Record host region, time, commit, Cobalt version and real device/browser. Never commit private URLs, cookies, keys or downloaded content as test evidence.

Public repository availability, merged source, successful CI and a deployed static frontend are distinct milestones. None independently proves successful media downloads.
