# Deployment

**English** | [繁體中文](../zh-TW/deployment.md) | [README](../../README.md)

> **Documentation stage: runnable source has not yet been imported.** Technical/deployment details describe the separately prepared source package, not code or a live service present on this branch. The commands below require that source package; they do not work on this documentation-only branch.

Publishing this repository is separate from deploying a working download service. The source destination is `jacbus1/framepocket`; no backend address is preconfigured. The expected project Pages URL is `https://jacbus1.github.io/framepocket/` **only after a successful Pages deployment**, not an assertion that it is live.

## Local development after source import

Use Node.js 22 or compatible newer. Copy `.env.example` to `.env`, run `npm run check`, `npm test`, then `npm start`. Open `http://localhost:3000`. No npm install is required for runtime dependencies.

| Variable | Default | Meaning |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Listening address; container sets `0.0.0.0` internally |
| `PORT` | `3000` | API and local frontend port |
| `PUBLIC_ORIGIN` | `http://localhost:3000` | Operator's public API origin; does not configure DNS or TLS |
| `ALLOWED_ORIGINS` | public origin | Comma-separated allowed frontend origins, without paths |
| `COBALT_URL` | empty | Root URL of a Cobalt service you control |
| `COBALT_API_KEY` | empty | Server-only key, when required by that service |
| `MAX_FILE_MB` | `100` | Byte cap in MiB; maximum configurable value 500 |

## Extraction and API hosting

Deploy Cobalt separately using [its official instructions](https://github.com/imputnet/cobalt/blob/main/docs/run-an-instance.md). Review/pin the exact upstream version and its license. The prepared Compose starts **only FramePocket**. Cobalt must return tunnel URLs reachable from the Node API. In Docker, localhost refers to the same container, not another service or the host.

```sh
cp .env.example .env
# Configure your own endpoints and secrets first.
docker compose up --build
```

Docker build/runtime have not been verified in this release preparation. The host port is loopback-only. Use a reviewed HTTPS gateway and egress controls before public exposure. Do not share a personal Meta session with anonymous site visitors.

Example values below are placeholders except for the repository owner's Pages origin:

```dotenv
PUBLIC_ORIGIN=https://YOUR-API-HOST
ALLOWED_ORIGINS=https://jacbus1.github.io
COBALT_URL=https://YOUR-OWN-COBALT-HOST/
COBALT_API_KEY=
MAX_FILE_MB=100
```

The browser Origin of `/framepocket/` is `https://jacbus1.github.io`, not a URL with the project path. All project sites under that same origin share that CORS boundary; a dedicated custom domain offers a distinct origin. CORS is not authentication.

## Connect the frontend

Edit `web/config.js` to contain only the public HTTPS API origin:

```js
window.FRAMEPOCKET_CONFIG = Object.freeze({
  apiBase: 'https://YOUR-API-HOST'
});
```

No secret may appear here. Empty `apiBase` uses the current origin, appropriate for the prepared Node server but not an API-less Pages site.

## Publish Pages after source/workflow import and review

Merge a reviewed source/workflow PR first. In repository Settings → Pages, select **GitHub Actions** as the source. In Actions, manually run **Publish frontend to Pages** from `main`. The prepared workflow runs checks/tests and uploads only `web/`; it does not provision Cobalt, an API, DNS or TLS for the API. It is deliberately not triggered by every push. That workflow is not part of this documentation PR.

References: [Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Do not use this repository, Pages or Actions artifacts to store downloaded media. Before operation, review hosting/platform terms and upstream licenses, configure bandwidth/abuse limits and a private security-reporting channel. The in-memory limiter/store is single-process; reverse-proxy and multi-replica operation need additional design. Read [security](../../SECURITY.md) and complete [live verification](verification.md).
