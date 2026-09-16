# FramePocket

**English** | [繁體中文](README.zh-TW.md)

A self-hostable research prototype for saving permitted public Instagram photos/videos and experimenting with Threads post videos. The web interface currently uses Traditional Chinese; this English README is a separate documentation edition.

> **Prototype, not a verified live download service.** Instagram requires your own Cobalt API. Threads extraction is experimental. Public source code and a published frontend do not mean a working backend has been deployed.

## What is included

| Component | Implementation | Verification boundary |
| --- | --- | --- |
| Responsive web interface | Link input, rights confirmation, file selection, explicit demo mode | Responsive CSS; browser rerun unavailable, real-device saves untested |
| Instagram adapter | Photos, videos, Reels and mixed carousel responses from self-hosted Cobalt | Synthetic response tests; live Cobalt/Instagram not verified |
| Threads adapter | Anonymous HTML/JSON/OG parsing tied to the requested post ID | Synthetic HTML tests only; live extraction not verified |
| File streaming | 60-second single-use tickets, MIME/byte limits, no application media archive | Mock upstream bytes; not a playable-video test |
| Deployment | Node server, Docker files, CI and manual Pages workflow | Docker, Pages and public API deployment still require verification |

No account crawling, private posts, Stories, login, cookies upload, CAPTCHA/DRM bypass, transcoding, resumable downloads or batch ZIP. Demo mode displays three synthetic items with disabled save buttons.

## Quick start

Use Node.js 22 or a compatible newer version. No third-party npm dependencies are required. Run the following commands from the repository root on this source-import branch (or after this PR is merged).

```sh
cp .env.example .env
npm run check
npm test
npm start
```

Open `http://localhost:3000`.

Without `COBALT_URL`, the interface remains usable as a demo; Instagram requests return `ENGINE_NOT_CONFIGURED` instead of fake download results.

### Configure Instagram

Deploy a Cobalt instance you control using [its official guide](https://github.com/imputnet/cobalt/blob/main/docs/run-an-instance.md), then edit `.env`:

```dotenv
COBALT_URL=https://YOUR-OWN-COBALT-HOST/
COBALT_API_KEY=
```

The hostname is a placeholder, not a provided service. Use the instance root, not `/api/resolve`. A key is optional only when your instance permits it; secrets belong on the server, never in `web/config.js`. The supplied Compose file starts FramePocket only, not Cobalt.

Threads uses no configured login/session. This does not guarantee anonymous availability: blocked, login-required, rate-limited, changed or video-free pages may fail.

## Architecture

```text
Static frontend (GitHub Pages or another host)
  -> your Node.js API
     -> Instagram: your self-hosted Cobalt
     -> Threads: experimental anonymous public HTML parser
  -> short-lived file tickets -> bounded media streams
```

[GitHub Pages serves static sites](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages); it cannot run this Node API. The manual Pages workflow publishes only `web/`. Set the public backend origin in `web/config.js` and configure the backend's exact allowed frontend origin. Do not publish media, `.env`, cookies or keys.

## Documentation

| Topic | English | Traditional Chinese |
| --- | --- | --- |
| Deployment and configuration | [Deployment](docs/en/deployment.md) | [部署](docs/zh-TW/deployment.md) |
| Licensing and external services | [Licensing](docs/en/licensing.md) | [授權](docs/zh-TW/licensing.md) |
| Research and evidence limits | [Research](docs/en/research.md) | [研究](docs/zh-TW/research.md) |
| Test scope and launch checklist | [Verification](docs/en/verification.md) | [驗證](docs/zh-TW/verification.md) |
| Security and reporting | [Security](SECURITY.md) | [安全](SECURITY.zh-TW.md) |
| Contributions | [Contributing](CONTRIBUTING.md) | [參與](CONTRIBUTING.zh-TW.md) |
| Changes | [Changelog](CHANGELOG.md) | [更新記錄](CHANGELOG.zh-TW.md) |

## License and attribution

Original FramePocket code and documentation are under the [MIT License](LICENSE), copyright **2026 jacbus1 and FramePocket contributors**. Keep the copyright and permission notice when redistributing substantial portions.

External services and tools retain their own licenses. Cobalt is not vendored here: its API uses AGPL-3.0 and its official web frontend is under CC-BY-NC-SA-4.0. This project does not redistribute that frontend, its fonts or its branding. See [third-party notices](THIRD_PARTY_NOTICES.md) and the [licensing guide](docs/en/licensing.md); an HTTP boundary is not a blanket legal exemption.

Only download content you own or have permission to save, and review the applicable platform/hosting rules. A public post is not a license to republish it. The rights checkbox is not proof of permission. This project is not affiliated with Meta, Instagram, Threads or Cobalt. The project name has not undergone trademark clearance.

`private: true` in `package.json` prevents accidental npm publishing; it does **not** make the GitHub repository private.
