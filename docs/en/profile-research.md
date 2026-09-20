# Instagram Profile Research Mode

Profile Research Mode is separate from media downloading. It enumerates public Instagram posts, reads captions and profile metadata, extracts GitHub repository candidates, verifies them with GitHub, and returns a deduplicated repository catalogue with descriptions and metadata.

## Run

Docker Compose includes Python and Instaloader 4.15.3. Start the normal stack:

```sh
docker compose up --build
```

Open the local web app and use **Profile Research Mode**, or POST JSON to `/api/profile-research`:

```json
{"url":"https://www.instagram.com/gittrend.io/","maxPosts":1000}
```

The response contains the profile summary, scan coverage, repositories and a CSV export string.

## Complete scans and login-gated profiles

Anonymous Instagram access can be rate-limited or login-gated. The browser UI never accepts Instagram passwords or cookie uploads. If Instagram requires a session, create an Instaloader session outside this app and mount it read-only, then set:

```dotenv
INSTAGRAM_SESSIONFILE=/sessions/session-youruser
INSTAGRAM_SESSION_USERNAME=youruser
```

For large repository catalogues set `GITHUB_TOKEN` in the server environment. The token is used only for GitHub API metadata lookups and is never returned to the browser.

## Boundaries

Only public profile/post metadata is researched. This mode does not download a profile's media, Stories, private posts, follower lists or private account data. Results can still be incomplete if Instagram stops enumeration, rate-limits the session, removes posts, or changes its private web interfaces. The result explicitly reports `posts_scanned`, `media_count` and `truncated`.
