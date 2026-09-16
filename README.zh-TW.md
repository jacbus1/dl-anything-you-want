# FramePocket

[English](README.md) | **繁體中文**

可自架的公開媒體下載研究原型，用於有權下載的 Instagram 相片／影片，以及實驗性的 Threads 貼文影片解析。

> **Repo 狀態：目前只準備文件及授權。** 可執行程式包已在其他工作環境整理及測試，但**尚未匯入這個 repo**，亦沒有已驗證的正式下載服務。不要對這個只有文件的分支執行 npm 指令。

## 專案範圍

已準備的原型包含原創繁體中文響應式介面及 Node.js API。Instagram 使用營運者控制的 Cobalt 服務；Threads 使用實驗性匿名 HTML 解析器。合成資料測試不等於真實平台已相容。

設計不包含私人帳號存取、整個帳號抓取、cookies 上傳、登入牆／CAPTCHA／DRM 繞過、轉檔或批量 ZIP。公開貼文不等於可以任意再發佈媒體。

## 文件導覽

以下說明的是已準備的程式包，以及**匯入程式碼之後**需要完成的步驟，不是此分支已部署的功能。網站介面目前為繁體中文，中英文文件則分開維護。

| 主題 | 繁體中文 | English |
| --- | --- | --- |
| 部署及設定 | [部署](docs/zh-TW/deployment.md) | [Deployment](docs/en/deployment.md) |
| 授權 | [授權](docs/zh-TW/licensing.md) | [Licensing](docs/en/licensing.md) |
| 外部部件 | [第三方聲明](THIRD_PARTY_NOTICES.zh-TW.md) | [Third-party notices](THIRD_PARTY_NOTICES.md) |
| 研究 | [研究](docs/zh-TW/research.md) | [Research](docs/en/research.md) |
| 驗證 | [驗證](docs/zh-TW/verification.md) | [Verification](docs/en/verification.md) |
| 安全 | [安全](SECURITY.zh-TW.md) | [Security](SECURITY.md) |
| 參與開發 | [參與](CONTRIBUTING.zh-TW.md) | [Contributing](CONTRIBUTING.md) |
| 更新記錄 | [更新](CHANGELOG.zh-TW.md) | [Changelog](CHANGELOG.md) |

## 授權

FramePocket 原創內容採用 [MIT License](LICENSE)，署名為 **2026 jacbus1 and FramePocket contributors**。再分發主要部分時須保留規定的版權及許可聲明。英文 LICENSE 是正式授權文字，中文文件只作說明，不取代原文。

外部部件保留自己的授權。此 repo 沒有打包 Cobalt：其 API 為 AGPL-3.0；官方前端為 CC-BY-NC-SA-4.0，不屬於 FramePocket。詳見 [授權說明](docs/zh-TW/licensing.md)。本專案 MIT 不授予第三方媒體、商標或外部服務權利。

## 後續實作里程碑

匯入並審閱程式包、執行 repo CI、設定你自架的 Cobalt 及 API，然後才選擇發佈靜態介面。[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) 不能執行 Node 後端。確認獲授權貼文及真實裝置儲存成功後，才宣稱服務可用。

目前不聲稱有已部署的後端、正式網站、安全回報電郵或成功的平台下載。本專案與 Meta、Instagram、Threads 或 Cobalt 無隸屬關係；名稱尚未完成商標清查。
