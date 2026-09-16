# Third-party notices

**English** | [繁體中文](THIRD_PARTY_NOTICES.zh-TW.md)

> **Documentation stage: runnable source has not yet been imported.** Technical/deployment details describe the separately prepared source package, not code or a live service present on this branch.

The [MIT License](LICENSE) applies to original FramePocket materials, not every service, runtime, tool or media file used alongside them. No upstream downloader source, third-party frontend, font file, platform media or credential is bundled in this repository.

| Component | Relationship | License / primary source |
| --- | --- | --- |
| Cobalt API | Optional, separately deployed service required by the Instagram adapter; not vendored | [AGPL-3.0](https://github.com/imputnet/cobalt/blob/main/api/LICENSE) |
| Cobalt official web frontend | Not used or redistributed; no Cobalt branding/font assets copied | [CC-BY-NC-SA-4.0 and additional asset conditions](https://github.com/imputnet/cobalt/blob/main/web/README.md) |
| Node.js | Runtime; base image downloads it separately | [Node.js license and bundled third-party notices](https://github.com/nodejs/node/blob/main/LICENSE) |
| Node Docker image / operating-system packages | External deployment environment; not covered by our MIT notice | [Official image source](https://github.com/nodejs/docker-node); review the exact image's component licenses |
| GitHub Actions | CI/deployment tools fetched by GitHub, not application runtime dependencies | [checkout](https://github.com/actions/checkout/blob/main/LICENSE), [setup-node](https://github.com/actions/setup-node/blob/main/LICENSE), [configure-pages](https://github.com/actions/configure-pages/blob/main/LICENSE), [upload-pages-artifact](https://github.com/actions/upload-pages-artifact/blob/main/LICENSE), [deploy-pages](https://github.com/actions/deploy-pages/blob/main/LICENSE) |

Runtime npm dependencies: **none**. Projects mentioned in the research notes are references, not installed dependencies.

Review the exact upstream revision/image used in production. Preserve applicable copyright, license and corresponding-source obligations when modifying or distributing third-party components. Merely hosting Cobalt separately does not establish compliance for every possible integration. No permission to use third-party trademarks or downloaded media is granted by FramePocket's license.

Upstream Cobalt license descriptions were checked on 2026-09-15 (America/Toronto); these links follow upstream branches and may change. See [licensing](docs/en/licensing.md) before deployment.
