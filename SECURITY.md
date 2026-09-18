# Security

**English** | [繁體中文](SECURITY.zh-TW.md)

DL Anything You Want 0.1.x is a research prototype, not an independently audited public service. No stable-version support or response-time SLA is promised.

## Reporting

Do not put credentials, active download tickets, private media or exploit details into a public issue. Use the repository's **Security → Report a vulnerability** route only if the owner has enabled private vulnerability reporting. No private channel or security email has been verified/configured by this change. If unavailable, ask the maintainer to enable one without disclosing the vulnerability. Enable a private channel before public service launch.

## Implemented boundaries

- Source URLs are limited to specific Facebook, Instagram, Threads, TikTok and YouTube HTTPS hosts and paths. No arbitrary URL proxy, login or visitor cookie/session upload.
- Media is limited to Meta CDN host suffixes or the configured Cobalt origin's exact `/tunnel` path. Non-trusted outbound sockets validate public IPv4 addresses at DNS lookup; redirects are bounded and revalidated. IPv6-only destinations are unsupported.
- Cobalt is trusted **operator configuration** and may use internal HTTP/private networks. End users cannot configure it. Its own extraction/network behavior is not audited here.
- Threads parses JSON without executing scripts, matches post IDs and requires matching canonical/OG URLs for fallback. Ambiguous/unavailable results fail closed.
- Input/HTML/JSON byte caps, a default 100 MiB streamed-file cap (maximum configuration 500 MiB), two active resolutions and two file transfers per process.
- In-memory fixed-window limits: six resolutions per socket IP/minute, 30 globally/minute, 24 file requests per socket IP/minute. `X-Forwarded-For` is not trusted.
- Random single-use tickets expire for access after 60 seconds; up to 500 entries. Expiration is lazy cleanup, not guaranteed physical deletion at precisely 60 seconds. Restart loses tickets.
- JPEG/PNG/WebP/MP4 MIME allowlist, generated filenames and attachment responses. MIME checking is not full media decoding or malware scanning.
- The application streams media without writing a media archive. No application history/database/analytics is implemented. Hosting, gateway, browser and Cobalt logging remain separate considerations.

## Before public operation

Use HTTPS, reviewed gateway authentication/abuse controls, connection/time/body limits, a bandwidth budget and ingress/egress restrictions. CORS and the checkbox are not authentication or proof of rights. Non-browser clients can forge Origin. The limiter is not DDoS protection.

A reverse proxy can group all users under one socket IP. Configure edge rate limits instead of trusting arbitrary forwarded headers. Multiple replicas need a shared ticket/rate store or deliberate routing. This prototype is single-process.

Review/pin runtime, container, Cobalt and Action versions; scan images/dependencies. Keep secrets out of assets/Git history. CI performs local code tests, not an upstream security audit. Configure reporting/takedown handling and review platform/hosting/content rules.

No Range/resume, transcoding, CAPTCHA bypass, retries around rate limits or private-account access. A stream crossing its cap after headers are sent is terminated; browsers must treat incomplete files as failed downloads. Complete [deployment](docs/en/deployment.md) and [verification](docs/en/verification.md) before calling the service live.
