# Research and implementation choice

**English** | [繁體中文](../zh-TW/research.md) | [README](../../README.md)

> **Documentation stage: runnable source has not yet been imported.** Technical/deployment details describe the separately prepared source package, not code or a live service present on this branch.

Research baseline: 2026-09-15 (America/Toronto). These are public-source research notes, not a live benchmark. No listed third-party downloader was tested against real platform media in this preparation.

## Chosen design

An original static UI and Node API, with a separate Cobalt HTTP adapter for Instagram and an experimental anonymous HTML adapter for Threads. No third-party download site's hosted API is used by default. The project contains no account login, cookie import or limit-bypass workflow.

Cobalt's [API README](https://github.com/imputnet/cobalt/blob/main/api/README.md) documents Instagram media; its [API protocol](https://github.com/imputnet/cobalt/blob/main/docs/api.md) provides picker/redirect/tunnel responses. FramePocket requests `alwaysProxy: true` and `localProcessing: "disabled"`, and rejects unsupported responses. This is protocol integration, not a live compatibility certificate.

The Threads parser matches the requested post code in JSON, or a matching canonical/OG URL before using OG video. It cannot establish that all public posts are anonymously accessible. Login pages, changed HTML and rate limits remain expected failure modes.

## Candidates and sources

| Project | Research role | Evidence boundary |
| --- | --- | --- |
| [Cobalt](https://github.com/imputnet/cobalt) | Instagram service integration | API/docs examined; no deployed engine tested |
| [Instaloader](https://github.com/instaloader/instaloader) | Instagram backup / possible alternative | Public feature documentation; not installed here |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Video-extractor research | Check supported sites and [Threads request #7523](https://github.com/yt-dlp/yt-dlp/issues/7523); do not treat a request as delivered support |
| [social-media-downloader](https://github.com/Vette1123/social-media-downloader) | Multi-platform integration reference | README claims need independent dependency and live checks |
| [Nostos](https://github.com/corvardt/nostos) | Local-tool architecture reference | Review its authentication/public-exposure warnings; not a production dependency |
| [gallery-dl](https://github.com/mikf/gallery-dl) | Gallery/archive research | Not part of the first implementation |

This launch change does not re-certify the current maintenance, issue state or all licenses of these research candidates. Check exact revisions before adoption. Cobalt's API/frontend license split is recorded separately in [third-party notices](../../THIRD_PARTY_NOTICES.md).

## Unknowns

Real Instagram photos/Reels/mixed carousels and Threads videos from the chosen host region; current anonymous visibility; the selected Cobalt version's exact behavior; media bandwidth cost; real iOS/Android saves; production safety and licensing/hosting review. No success rate or unlimited-access claim is made. See [verification](verification.md).
