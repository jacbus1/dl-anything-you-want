# Instagram Profile Research Mode

Profile Research Mode 與媒體下載分開。它會枚舉公開 Instagram 貼文、讀取 caption／profile metadata、抽取 GitHub repository 候選，再用 GitHub 驗證及去重，輸出 repo 連結、用途描述與 metadata。

## 使用

Docker Compose 已包含 Python 及 Instaloader 4.15.3：

```sh
docker compose up --build
```

開啟本機網站使用 **Profile Research Mode**，或向 `/api/profile-research` POST：

```json
{"url":"https://www.instagram.com/gittrend.io/","maxPosts":1000}
```

回應包括 profile 摘要、掃描覆蓋率、repository 清單及 CSV 字串。

## 完整掃描與登入限制

Instagram 匿名存取可能被限流或要求登入。網站介面不接收 Instagram 密碼或 cookies。若 Instagram 要求 session，請在此程式之外建立 Instaloader session，唯讀 mount 後設定：

```dotenv
INSTAGRAM_SESSIONFILE=/sessions/session-youruser
INSTAGRAM_SESSION_USERNAME=youruser
```

大量 repo enrichment 建議在伺服器環境設定 `GITHUB_TOKEN`，只用於 GitHub API metadata 查詢，不會回傳給瀏覽器。

## 邊界

只研究公開 profile／post metadata，不會批量下載帳戶媒體、Stories、私人貼文、followers 或私人帳戶資料。Instagram 如中斷枚舉、限流、刪帖或改動介面，結果仍可能不完整；回應會明確提供 `posts_scanned`、`media_count` 及 `truncated`。
