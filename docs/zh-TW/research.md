# 研究與技術選擇

[English](../en/research.md) | **繁體中文** | [README](../../README.zh-TW.md)

> **文件階段：可執行程式尚未匯入 repo。** 技術及部署說明適用於另行準備的程式包，不代表此分支已包含程式或已上線。

研究基線：2026-09-15（America/Toronto）。這是公開來源研究記錄，不是真實平台測速或成功率比較。本輪沒有用列出的第三方下載器實測真實媒體。

## 採用架構

原創靜態介面及 Node API，Instagram 使用獨立 Cobalt HTTP 轉接器，Threads 使用實驗性匿名 HTML 轉接器。不預設借用第三方下載站的公開 API，沒有帳號登入、cookies 導入或規避限流流程。

Cobalt 的 [API README](https://github.com/imputnet/cobalt/blob/main/api/README.md) 說明 Instagram 媒體支援，[API 協定](https://github.com/imputnet/cobalt/blob/main/docs/api.md) 包含 picker／redirect／tunnel 回應。FramePocket 要求 `alwaysProxy: true` 及 `localProcessing: "disabled"`，遇到不支援回應會拒絕處理。這是協定整合，不是真實相容性認證。

Threads 解析器先匹配 JSON 的貼文 code，或核對 canonical／OG URL 才採用 OG 影片。它不能證明所有公開貼文均可匿名取得；登入頁、HTML 改動、限流仍是預期失敗情況。

## 候選及來源

| 專案 | 研究用途 | 證據邊界 |
| --- | --- | --- |
| [Cobalt](https://github.com/imputnet/cobalt) | Instagram 服務整合 | 檢視 API／文件；未測試已部署引擎 |
| [Instaloader](https://github.com/instaloader/instaloader) | Instagram 備份／可能替代方案 | 公開功能文件；沒有安裝到本專案 |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | 影片提取研究 | 核對支援清單及 [Threads 請求 #7523](https://github.com/yt-dlp/yt-dlp/issues/7523)，不能把功能請求當成已交付支援 |
| [social-media-downloader](https://github.com/Vette1123/social-media-downloader) | 多平台整合參考 | README 宣稱須另核依賴及真實行為 |
| [Nostos](https://github.com/corvardt/nostos) | 本機工具架構參考 | 須核對其驗證／公開暴露警告；不是正式依賴 |
| [gallery-dl](https://github.com/mikf/gallery-dl) | 圖庫／備份研究 | 首版沒有使用 |

這次首版變更沒有重新認證全部候選的目前維護情況、issue 狀態或授權；採用前須核對具體版本。Cobalt 的 API／前端授權分別記於 [第三方聲明](../../THIRD_PARTY_NOTICES.zh-TW.md)。

## 未知項目

目標主機區域的真實 Instagram 相片／Reels／混合輪播與 Threads 影片、目前匿名可見性、選定 Cobalt 版本的行為、媒體流量費、真實 iOS／Android 儲存、正式安全及授權／主機審查。沒有成功率或無限制下載的聲稱。詳見 [驗證](verification.md)。
