# Profile Research Mode

Profile Research Mode 與媒體下載分開，支援 **Instagram、Threads、TikTok**。流程分兩階段：

1. **Scan profile**：枚舉公開貼文 metadata 與 caption／文字。
2. **Analyze selected**：由使用者勾選真正想研究的 posts，再做摘要及 GitHub repository 抽取。

GitHub 候選會盡量向 GitHub 驗證，輸出 repo link、用途描述、stars、language、topics、更新時間及來源 post；亦提供 CSV。

## 使用

Docker Compose 已包含 Python、Instaloader 4.15.3 及 yt-dlp 2026.8.19：

```sh
docker compose up --build
```

開啟本機網站使用 **Profile Research Mode**。

### API：先掃 profile

POST `/api/profile-scan`：

```json
{
  "platform": "instagram",
  "url": "https://www.instagram.com/gittrend.io/",
  "maxPosts": 200
}
```

`platform` 可選：`instagram`、`threads`、`tiktok`。

回應會有 profile metadata 及可勾選的 `posts`；每帖包含 id、URL、日期、文字，以及該帖偵測到的 GitHub candidates。

### API：只分析選定 posts

向 `/api/profile-analyze` 傳入使用者已勾選的 posts：

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

回應包括：

- selected posts 的整體摘要及 themes；
- 每帖獨立 summary；
- 經驗證的 GitHub repository 清單；
- repo 用途描述及 metadata；
- CSV 匯出。

## 各平台 collector

| 平台 | Profile 枚舉 | 備註 |
| --- | --- | --- |
| Instagram | Instaloader 4.15.3 | 公開 profile 可匿名嘗試；部分帳戶需要 operator-owned Instaloader session |
| TikTok | yt-dlp 2026.8.19 | 使用公開 user extractor；部分 profile 可能需要 operator-owned cookies，或 TikTok 不提供 secondary user ID 而失敗 |
| Threads | Provider adapter | v0.5.0 以可設定 Apify actor 枚舉 profile；單一 Threads post 下載仍然走本機原有流程 |

### Instagram session

網站不接收 Instagram 密碼或 cookies。若需要 session，請在程式之外建立，再以 read-only mount 提供：

```dotenv
INSTAGRAM_SESSIONFILE=/sessions/session-youruser
INSTAGRAM_SESSION_USERNAME=youruser
```

### TikTok cookies

需要時可 read-only mount operator-owned Netscape 格式 cookies：

```dotenv
TIKTOK_COOKIES_FILE=/sessions/tiktok-cookies.txt
```

### Threads provider

Threads profile 枚舉設定：

```dotenv
APIFY_TOKEN=...
THREADS_APIFY_ACTOR=logiover~threads-scraper
```

Provider adapter 已隔離，日後換成自架 browser collector 時不需要改 scan／analyze API。

## GitHub enrichment

大型 profile 建議在 server 環境設定 `GITHUB_TOKEN`。只會用於 GitHub repo metadata lookup，不會回傳到瀏覽器。

## 摘要

如果沒有外部模型，系統仍會產生本機 extractive summary 及 recurring-keyword themes。

如要較完整 AI 摘要，可設定 OpenAI-compatible chat-completions endpoint：

```dotenv
SUMMARY_API_URL=https://your-compatible-endpoint.example/v1/chat/completions
SUMMARY_API_KEY=...
SUMMARY_MODEL=...
```

只有**使用者已選定 posts 的文字**會送到該 summarization endpoint。

## 邊界

只研究公開 profile／post metadata；不會批量下載整個帳戶媒體、不抓私人貼文、Stories、followers、不上傳 browser credentials，亦不繞過 CAPTCHA／DRM。平台限流、要求登入、刪帖、改版或 provider unavailable 時，結果可能不完整；scan response 會標明掃描數量、provider 及是否 partial。
