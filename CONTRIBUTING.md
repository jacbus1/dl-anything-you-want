# Contributing

**English** | [繁體中文](CONTRIBUTING.zh-TW.md)

Use a topic branch and pull request. Keep the English and Traditional Chinese documentation editions in sync. The site UI is currently Traditional Chinese; documentation translation alone does not add an English UI.

Run `npm run check` and `npm test` on Node.js 22-compatible runtime. Add synthetic regression fixtures for behavior changes. Label local, mocked, live-platform and real-device tests separately; never equate a green unit suite with working Instagram/Threads extraction.

Submit only code/assets you may license under MIT. Declare dependencies and preserve applicable external notices. Never commit `.env`, API keys, cookies, sessions, downloaded media or personal user data. Use invented post IDs and test URLs.

Keep source/CDN allowlists, bounded requests and fail-closed behavior. Proposals to add login, private content, bulk crawling or new platforms require separate design and security review, not silent scope expansion.

For ordinary bugs, give the commit/runtime, reproduction and redacted error code in an issue. Do not publish secrets or vulnerability details; see [security reporting](SECURITY.md). Keep PRs focused and explain tests, limits and license implications.
