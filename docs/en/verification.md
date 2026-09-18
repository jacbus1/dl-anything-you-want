# Verification

**English** | [繁體中文](../zh-TW/verification.md) | [README](../../README.md)

## Current local result — 2026-09-18

| Check | Result |
| --- | --- |
| Unit, HTTP and repository tests | 87 passed, 0 failed |
| Docker Compose | App running; digest-pinned Cobalt 11.7.1 healthy |
| Instagram Reel | Resolved and downloaded through the browser and API |
| Downloaded Instagram file | MP4, 5,177,355 bytes; H.264 720×1280 + AAC; 52.636780 seconds |
| Threads supplied share link | Video and image downloaded locally; see [test record](../threads-live-test-2026-09-18.md) |
| English and Traditional Chinese pages | Rendered in the in-app browser; no console warnings or errors |
| Facebook and TikTok | URL routing and rejection tests pass; no live links supplied for download testing |
| GitHub Pages | Static frontend only; a separate Node/Cobalt host is required for public downloads |
| Real iPhone/Android saving | Not tested |

Live checks cover only the supplied public posts at the recorded time and location. Platform changes, access restrictions and rate limits can still break extraction. Downloaded media remains in the ignored local `downloads/` directory and is not committed.

## Reproduce

Run `docker compose up --build`, open `http://localhost:3000`, then use content you own or may download. Run `npm run check && npm test` for the automated suite. Record the tested URL type, UTC time, commit, Cobalt version, MIME type, file size, duration and browser/device when adding compatibility evidence.
