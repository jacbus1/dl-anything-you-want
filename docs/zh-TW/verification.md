# 驗證

[English](../en/verification.md) | **繁體中文** | [README](../../README.zh-TW.md)

## 目前本機結果 — 2026-09-18

| 檢查 | 結果 |
| --- | --- |
| 單元、HTTP 及 repo 測試 | 87 通過，0 失敗 |
| Docker Compose | App 正常運行；固定 digest 的 Cobalt 11.7.1 健康 |
| Instagram Reel | 已經由瀏覽器及 API 解析並下載 |
| Instagram 下載檔案 | MP4，5,177,355 bytes；H.264 720×1280 + AAC；52.636780 秒 |
| 使用者提供的 Threads 分享連結 | 影片及圖片已在本機下載；見[測試記錄](../threads-live-test-2026-09-18.md) |
| 英文及繁體中文頁面 | 已在內置瀏覽器顯示；console 沒有警告或錯誤 |
| Facebook 及 TikTok | URL 路由及拒絕測試通過；未提供真實連結作下載測試 |
| GitHub Pages | 只提供靜態介面；公開下載另需 Node／Cobalt 主機 |
| 真實 iPhone／Android 儲存 | 未測試 |

真實測試只代表指定時間、地點及使用者提供的公開貼文。平台改版、存取限制及限流仍可能令解析失敗。下載媒體保留於已忽略的本機 `downloads/` 目錄，不會提交到 GitHub。

## 重現方式

執行 `docker compose up --build`，開啟 `http://localhost:3000`，再使用你擁有或獲准下載的內容。執行 `npm run check && npm test` 可重跑自動測試。新增相容性證據時，應記錄網址類型、UTC 時間、commit、Cobalt 版本、MIME、檔案大小、時長及瀏覽器／裝置。
