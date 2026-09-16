# FramePocket

**English** | [繁體中文](README.zh-TW.md)

A self-hostable research prototype for permitted public Instagram photos/videos and experimental Threads post videos.

> **Repository status: documentation and licensing preparation only.** The runnable source package has been prepared and tested separately, but has **not yet been imported into this repository**. There is no verified live download service. Do not run npm commands against this documentation-only branch.

## Project scope

The prepared prototype has an original Traditional Chinese responsive interface and a Node.js API. Instagram uses an operator-controlled Cobalt service; Threads uses an experimental anonymous HTML parser. Synthetic tests do not prove live platform compatibility.

The design does not include private-account access, account crawling, cookies upload, login-wall/CAPTCHA/DRM bypass, transcoding or batch ZIP. A public post is not permission to republish its media.

## Documentation

These guides describe the prepared source package and the steps required **after source import**, not capabilities already deployed from this branch. The website UI is currently Traditional Chinese; English and Chinese documentation are separate editions.

| Topic | English | Traditional Chinese |
| --- | --- | --- |
| Deployment and configuration | [Deployment](docs/en/deployment.md) | [部署](docs/zh-TW/deployment.md) |
| Licensing | [Licensing](docs/en/licensing.md) | [授權](docs/zh-TW/licensing.md) |
| External components | [Third-party notices](THIRD_PARTY_NOTICES.md) | [第三方聲明](THIRD_PARTY_NOTICES.zh-TW.md) |
| Research | [Research](docs/en/research.md) | [研究](docs/zh-TW/research.md) |
| Verification | [Verification](docs/en/verification.md) | [驗證](docs/zh-TW/verification.md) |
| Security | [Security](SECURITY.md) | [安全](SECURITY.zh-TW.md) |
| Contributions | [Contributing](CONTRIBUTING.md) | [參與](CONTRIBUTING.zh-TW.md) |
| Changes | [Changelog](CHANGELOG.md) | [更新](CHANGELOG.zh-TW.md) |

## License

Original FramePocket materials are released under the [MIT License](LICENSE), copyright **2026 jacbus1 and FramePocket contributors**. Preserve the required copyright and permission notice when redistributing substantial portions. The English LICENSE is the canonical text; the Chinese guide explains it without replacing it.

External components retain their own licenses. Cobalt is not bundled: its API uses AGPL-3.0; its official frontend uses CC-BY-NC-SA-4.0 and is not part of FramePocket. See [licensing](docs/en/licensing.md). This MIT notice does not grant rights to third-party media, trademarks or external services.

## Next implementation milestones

Import and review the source package, run repository CI, configure your own Cobalt and API, then optionally deploy the static frontend. [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) cannot run the Node backend. Verify owned/permitted posts and real-device saves before claiming the service works.

No backend hostname, live website, security-reporting email or successful platform download is claimed. This project is not affiliated with Meta, Instagram, Threads or Cobalt; its name has not undergone trademark clearance.
