# 驗證

[English](../en/verification.md) | **繁體中文** | [README](../../README.zh-TW.md)

## 原始碼匯入證據 — 2026-09-16 UTC

來源為 `framepocket-0.1.0-bilingual-source.zip`。其 SHA-256、只有文件的基底 commit、執行環境與最新本機結果記於 [local-tests.json](../local-tests.json)。修正前原有 74 項測試全部通過；加入併發及 canonical 衝突回歸測試後，共 76 項通過。可在 repo 根目錄執行 `npm test` 及 `npm run check`。

本分支包含 Node API、繁體中文靜態介面、設定範例、Docker／Compose、CI 及手動 Pages workflow。匯入不代表已部署；GitHub CI 結果須到 PR 查看，本機通過不等於遠端 CI 通過。

| 檢查 | 本次匯入結果 |
| --- | --- |
| Node 單元／本機 HTTP 及 repo 測試 | 76 通過，0 失敗／跳過；Node v24.19.0 |
| JavaScript 語法 | 通過 |
| 預設 `npm start`、健康端點、靜態資產、未設定引擎錯誤 | loopback 通過，沒有要求外部媒體 |
| Node 22／24 CI | 已加入 workflow，實際結果須查看 PR |
| Docker build／執行 | 本機嘗試無法執行：沒有 Docker；CI 已加入 Compose 基本測試 |
| 瀏覽器基本測試 | 無法執行：沒有 Chromium；安裝逾時／返回 HTTP 502 |
| 真實 Instagram／已部署 Cobalt | 未測試 |
| 真實 Threads 解析／下載 | 未測試 |
| 真實 iPhone／Android 儲存 | 未測試 |
| Pages／公開 API 部署 | 未進行 |
| 獨立安全／法律審計 | 未進行 |

解析器測試使用虛構貼文 ID 及合成 Cobalt／HTML 回應。本機 HTTP 測試以 loopback server 配合模擬解析器／媒體；標成 `video/mp4` 的 bytes 不是可播放影片。新增回歸測試核對延遲 body 不能超過兩個同時解析請求，以及 canonical／OG 貼文身份衝突時拒絕解析。Repo 檢查包含署名、雙語文件、相對連結及手動 Pages 只發佈靜態內容。

歷史瀏覽器排版檢查不代表本次匯入已驗證；不宣稱新的瀏覽器、手機排版、可播放媒體或實機儲存測試通過。Docker CI 只檢查容器啟動、健康及首頁，不執行 Cobalt，亦不能證明平台相容性。

## 宣稱真實平台相容前

以有權下載的 Instagram 相片、Reel、混合輪播，以及 Threads 單／多影片、無影片貼文測試；檢查封鎖、登入要求、刪除、429、MIME／實際內容／大小／時長、瀏覽器完整儲存、票證過期、限額、CORS 及 TLS。記錄主機地區、UTC 時間、測試 commit、Cobalt 確切版本與實機／瀏覽器。不要提交私人 URL、cookies、keys 或下載媒體作證據。

公開原始碼、合併 PR、CI 通過、前端部署及真實下載成功是不同里程碑。未測組合應維持「未驗證」。
