# YouTube live test — 2026-09-18

The local Docker Compose stack used digest-pinned Cobalt 11.7.1 with no cookies, Google account, PO-token service or visitor session. The public YouTube URL `https://www.youtube.com/watch?v=jNQXAC9IVRw` was selected because it is short and widely used as an extractor test.

The application resolved and downloaded both requested outputs through its own `/api/resolve` and one-time `/api/file/…` flow:

- MP4: 742,286 bytes, H.264 320×240 plus AAC audio, 19.130249 seconds.
- MP3: 305,707 bytes, MP3 audio, 19.095500 seconds.

Both files passed `ffprobe`. The browser UI also produced a visible `dl-anything-01.mp3` result with YouTube and MP3 selected. The ignored files remain in `downloads/` and are not published.

This confirms one ordinary public video at this time. It does not prove access to age-restricted, private, members-only, region-blocked or otherwise restricted videos. Cobalt documents optional operator-managed cookies for services that require authentication; this application does not accept visitor cookie uploads.
