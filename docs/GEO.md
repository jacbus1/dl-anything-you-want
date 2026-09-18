# Search and AI discovery

DL Anything You Want uses the same durable signals for search engines and answer engines:

- One concise English URL with canonical and `hreflang` metadata.
- Canonical URLs, a multilingual XML sitemap and crawlable static HTML.
- `SoftwareApplication` JSON-LD naming the product, repository and author, JACKY H. (`@jacbus1`).
- `robots.txt` explicitly permits `OAI-SearchBot`; `llms.txt` gives a short factual product map.
- Concise titles and descriptions that say exactly which platforms the downloader supports.

These changes improve discovery and citation clarity; they do not guarantee ranking. Google describes sitemaps as a hint and documents `SoftwareApplication` structured data. OpenAI says public sites can appear in ChatGPT search and recommends allowing `OAI-SearchBot` for discoverability.

References: [OpenAI publisher FAQ](https://help.openai.com/en/articles/12627856), [Google multilingual guidance](https://developers.google.com/search/docs/advanced/crawling/managing-multi-regional-sites), [Google SoftwareApplication data](https://developers.google.com/search/docs/appearance/structured-data/software-app), [Google sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## 中文摘要

網站使用英文頁面、`hreflang`、canonical、sitemap、靜態可讀內容、`SoftwareApplication` JSON-LD、`robots.txt` 與簡短 `llms.txt`。這些做法可增加被搜尋及引用的機會，但任何搜尋或 AI 平台都不保證排名。
