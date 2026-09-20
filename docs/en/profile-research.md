# Profile Research Mode

Profile Research Mode is separate from media downloading. It supports **Instagram, Threads and TikTok** profile research with a two-stage workflow:

1. **Scan profile** — enumerate public post metadata and captions/text.
2. **Analyze selected** — choose only the posts you want to study, then summarize them and extract GitHub repository candidates.

GitHub candidates are verified against GitHub when possible and returned with purpose description, stars, language, topics, update time and source-post references. A CSV export is included.

## Run

Docker Compose includes Python, Instaloader 4.15.3 and yt-dlp 2026.8.19:

```sh
docker compose up --build
```

Open the local web app and use **Profile Research Mode**.

### API: scan

POST `/api/profile-scan`:

```json
{
  "platform": "instagram",
  "url": "https://www.instagram.com/gittrend.io/",
  "maxPosts": 200
}
```

Supported `platform` values: `instagram`, `threads`, `tiktok`.

The response contains profile metadata plus a selectable `posts` array. Each post includes an id, URL, date, text and any GitHub candidates detected in that post.

### API: analyze selected posts

POST `/api/profile-analyze` with only the posts the user selected:

```json
{
  "platform": "instagram",
  "profile": {"username": "gittrend.io"},
  "posts": [
    {
      "id": "ABC123",
      "url": "https://www.instagram.com/p/ABC123/",
      "text": "..."
    }
  ]
}
```

The response contains:

- overall summary and themes,
- one summary per selected post,
- verified GitHub repository catalogue,
- repository purpose descriptions and metadata,
- CSV export.

## Platform adapters

| Platform | Profile enumeration | Notes |
| --- | --- | --- |
| Instagram | Instaloader 4.15.3 | Public profiles can work anonymously; some profiles require an operator-owned Instaloader session |
| TikTok | yt-dlp 2026.8.19 | Public user extractor; some profiles may require an operator-owned cookies file or may fail when TikTok withholds the secondary user ID |
| Threads | Provider adapter | v0.5.0 uses a configurable Apify actor for profile enumeration; individual Threads post downloading remains local |

### Instagram session

The browser never accepts Instagram passwords or cookie uploads. If Instagram requires a session, create it outside this app, mount it read-only and set:

```dotenv
INSTAGRAM_SESSIONFILE=/sessions/session-youruser
INSTAGRAM_SESSION_USERNAME=youruser
```

### TikTok cookies

If needed, mount an operator-owned Netscape-format cookies file read-only and set:

```dotenv
TIKTOK_COOKIES_FILE=/sessions/tiktok-cookies.txt
```

### Threads provider

For Threads profile enumeration:

```dotenv
APIFY_TOKEN=...
THREADS_APIFY_ACTOR=logiover~threads-scraper
```

The adapter is isolated so another self-hosted collector can replace it later without changing the scan/analyze API.

## GitHub enrichment

For large profiles, set `GITHUB_TOKEN` in the server environment. It is used only for GitHub repository metadata lookups and is never returned to the browser.

## Summaries

Without an external model, the system always produces local extractive summaries and recurring-keyword themes.

An optional OpenAI-compatible chat-completions endpoint can provide richer summaries:

```dotenv
SUMMARY_API_URL=https://your-compatible-endpoint.example/v1/chat/completions
SUMMARY_API_KEY=...
SUMMARY_MODEL=...
```

Only the text of the **selected posts** is sent to that configured summarization endpoint.

## Boundaries

This mode researches public profile/post metadata. It does not bulk-download profile media, scrape private posts, Stories or follower lists, upload browser credentials, or bypass CAPTCHA/DRM. Results can be incomplete when a platform rate-limits, requires login, removes posts, changes its web interfaces, or when a configured provider is unavailable. Scan responses explicitly report the number of posts scanned, provider and whether the scan was partial.
