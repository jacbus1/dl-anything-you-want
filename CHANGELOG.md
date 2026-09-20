# Changelog

## Instagram profile-grid download links 0.5.1 — 2026-09-20

- Accept individual Instagram post and Reel links copied from profile grids in `/username/reel/post-id/` form.
- Keep profile URLs and whole-account crawling out of scope.
- Verify a public @githubsignals Reel as MP4 and MP3 through the local app.

## Profile Research Mode 0.5.0 — 2026-09-19

- Add Instagram, Threads and TikTok profile research adapters.
- Split research into profile scanning and selected-post analysis so users choose which posts to summarize.
- Extract and verify GitHub repositories from selected post text; return descriptions, stars, topics, language, update time and CSV.
- Add optional OpenAI-compatible summarization with a local extractive fallback.
- Keep operator sessions/tokens server-side; the browser never accepts Instagram/TikTok cookies or passwords.
- Pin Instaloader 4.15.3 and yt-dlp 2026.8.19 in the Docker image; Threads profile enumeration uses a configurable provider adapter.



## GitHub discovery 0.4.2 — 2026-09-18

- Position the repository as Social Media Downloader & Converter.
- Add searchable Facebook (FB), Instagram (IG), Threads, YouTube and TikTok terms to project and web metadata.
- Keep English as the default website and repository language.

## Media-only 0.4.1 — 2026-09-18

- Use one English interface with MP4, MP3 and PNG outputs only.
- Remove TEXT transcription, language selection, whisper.cpp and the bundled model.
- Keep FFmpeg for MP3 and PNG conversion, reducing Docker build size and time.

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