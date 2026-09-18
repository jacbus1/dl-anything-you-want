# DL Anything You Want

**English** | [繁體中文](README.zh-TW.md)

A bilingual Facebook, Instagram, Threads and TikTok public video downloader. Built by [JACKY H. (@jacbus1)](https://github.com/jacbus1).

> **Local prototype.** Compose includes Cobalt; Threads extraction is experimental. GitHub Pages publishes only the interface, not the download API.

## What is included

| Component | Implementation | Verification boundary |
| --- | --- | --- |
| Responsive web interface | Link input, rights confirmation, file selection, English and Traditional Chinese pages | Responsive CSS and browser flow |
| Facebook / Instagram / TikTok | Public video extraction through the included Cobalt service | Compatibility depends on the platform and upstream version |
| Threads adapter | Anonymous HTML/JSON/OG parsing tied to the requested post ID; video and post media images | One public post was downloaded locally; platform changes can still break extraction |
| File streaming | 60-second single-use tickets, MIME/byte limits, no application media archive | Supplied Instagram MP4 and Threads media downloaded locally |
| Deployment | Node server, optional Docker Compose, CI and Pages workflow | Pages serves the static frontend only |

No account crawling, private posts, Stories, login, cookies upload, CAPTCHA/DRM bypass or batch ZIP.

## Quick start

The shortest complete setup is:

```sh
docker compose up --build
```

Open `http://localhost:3000`.

Docker is optional. Without Docker, follow the [official Cobalt guide](https://github.com/imputnet/cobalt/blob/main/docs/run-an-instance.md) to run Cobalt with Node.js, Git and pnpm, set `COBALT_URL` in `.env`, then run `npm start`.

### Manual Cobalt configuration

Deploy a Cobalt instance you control using [its official guide](https://github.com/imputnet/cobalt/blob/main/docs/run-an-instance.md), then edit `.env`:

```dotenv
COBALT_URL=https://YOUR-OWN-COBALT-HOST/
COBALT_API_KEY=
```

The hostname is a placeholder. Compose includes a digest-pinned Cobalt image; manual startup requires `COBALT_URL`.

Threads uses no configured login/session. This does not guarantee anonymous availability: blocked, login-required, rate-limited, changed or media-free pages may fail.

## Architecture

```text
Static frontend (GitHub Pages or another host)
  -> your Node.js API
     -> Facebook / Instagram / TikTok: self-hosted Cobalt
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
| Search and AI discovery | [GEO](docs/GEO.md) | [GEO](docs/GEO.md) |
| Security and reporting | [Security](SECURITY.md) | [安全](SECURITY.zh-TW.md) |
| Contributions | [Contributing](CONTRIBUTING.md) | [參與](CONTRIBUTING.zh-TW.md) |
| Changes | [Changelog](CHANGELOG.md) | [更新記錄](CHANGELOG.zh-TW.md) |

## License and attribution

Original DL Anything You Want code and documentation are under the [MIT License](LICENSE), copyright **2026 jacbus1 and DL Anything You Want contributors**. Keep the copyright and permission notice when redistributing substantial portions.

External services and tools retain their own licenses. Cobalt is not vendored here: its API uses AGPL-3.0 and its official web frontend is under CC-BY-NC-SA-4.0. This project does not redistribute that frontend, its fonts or its branding. See [third-party notices](THIRD_PARTY_NOTICES.md) and the [licensing guide](docs/en/licensing.md); an HTTP boundary is not a blanket legal exemption.

Only download content you own or have permission to save, and review the applicable platform/hosting rules. A public post is not a license to republish it. The rights checkbox is not proof of permission. This project is not affiliated with Meta, Instagram, Threads or Cobalt. The project name has not undergone trademark clearance.

`private: true` in `package.json` prevents accidental npm publishing; it does **not** make the GitHub repository private.
