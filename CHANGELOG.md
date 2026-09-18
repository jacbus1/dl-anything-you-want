# Changelog

**English** | [繁體中文](CHANGELOG.zh-TW.md)

## Source import — 2026-09-16

- Import the original Node API, Traditional Chinese frontend, fixtures, Docker files and manual static-only Pages workflow from the bilingual source package.
- Run syntax and unit/local HTTP checks on Node 22 and 24 in CI; add a Docker Compose health/frontend smoke job.
- Fix the resolver concurrency check after asynchronous body reads and reject conflicting Threads OG/canonical identity; add regression tests.
- Record fresh local test evidence and unavailable Docker/browser checks separately from live-platform compatibility.

## Documentation preparation — 2026-09-15 (America/Toronto)

- Replace the initial placeholder with separate English and Traditional Chinese READMEs.
- Add the MIT License with jacbus1 and DL Anything You Want contributors attribution.
- Add separate bilingual third-party notices, licensing, deployment, research, verification, security and contribution guides.
- Explicitly identify the repository as documentation-only until the runnable source is imported.

The source package was prepared separately with 74 passing local tests and syntax checks. Source upload was blocked by the connector safety check; no runtime files or workflows are included in this PR. No live-platform download, Docker, real-device or public-service deployment is claimed.
