# Changelog


## Multilingual TEXT 0.4.0 — 2026-09-18

- Add local multilingual speech-to-text with automatic detection plus Chinese, Cantonese, English, Japanese, Korean, Spanish, French and German choices.
- Build pinned whisper.cpp 1.9.4 and a checksum-verified multilingual tiny model into the Docker application image.
- Materialize and validate converted files before sending download headers, preventing failed FFmpeg jobs from returning empty 200 responses.
- Add TEXT output and correct bilingual preparation/error labels.


## Downloader and converter 0.3.0 — 2026-09-18

- Add YouTube watch, short-link, Shorts and live URL handling through self-hosted Cobalt.
- Separate platform and output selectors; support MP4 video, MP3 audio and PNG images where media is available.
- Add FFmpeg conversion for PNG and Threads MP3, plus strict platform/format validation.
- Verify YouTube MP4 and MP3 without cookies, and verify Threads PNG and MP3 conversion.

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