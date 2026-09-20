# Instagram profile-grid link test — 2026-09-20

Source account: public `@githubsignals` profile listed in the user-supplied GitHub discovery report.

The public profile grid exposed the Reel permalink `https://www.instagram.com/githubsignals/reel/DdhFkgHgW4z/`. Version 0.4.3 normalized that profile-prefixed URL to the canonical Reel URL and completed both downloads through the local Node/Cobalt stack without Instagram cookies.

| Output | Result |
| --- | --- |
| MP4 | 4,584,373 bytes; H.264 720×1280 + AAC; 32.98 seconds |
| MP3 | 526,611 bytes; MPEG Layer III; 128 kbps; 48 kHz; 32.90 seconds |

A profile URL such as `https://www.instagram.com/githubsignals/` is deliberately rejected. The app downloads individual public post/Reel links and does not crawl or batch-download an account.
