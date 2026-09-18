# Threads share-link verification — 2026-09-18 UTC

The requested share URL redirected to a public Threads post. The original implementation rejected `/share/` URLs. The provider now accepts official Threads share URLs, establishes the post identity from an official redirect, then fetches the clean canonical URL. Further redirects cannot change that identity. Tracking-bearing share destinations can serve an HTML shell without video data, so the clean canonical request is necessary.

Local verification (Node v26.7.0): 79 tests passed, including share redirects, identity locking, unsafe destinations and unresolved share URLs. Syntax checks passed. A real POST to `/api/resolve` using the original share URL returned HTTP 200; its one-time `/api/file/…` URL returned HTTP 200 and `video/mp4`, with 5,232,517 bytes. ffprobe identified H.264 video at 1196×718 and AAC audio, duration 38.497279 seconds. Full ffmpeg audio/video decoding completed without errors.

The downloaded file remains in the ignored local `downloads/` directory and is not published to GitHub. No cookies, login or external Cobalt instance were used. This verifies this single local download at this time, not every Threads post or future availability. GitHub Pages serves only the frontend; no public download backend was deployed.
