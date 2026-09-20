# Social Media Downloader & Converter

[English](README.md) | **繁體中文**

**DL Anything You Want** 是 Facebook（FB）、Instagram（IG）、Threads、YouTube、TikTok 的社交媒體下載、轉換及 Profile Research 工作台；網站預設使用英文。作者：[JACKY H. (@jacbus1)](https://github.com/jacbus1)。

> **本機原型。** Compose 已包含 Cobalt；Threads 解析仍屬實驗性。GitHub Pages 只發佈介面，不會運行下載 API。

## 包含甚麼

| 部分 | 已實作 | 驗證邊界 |
| --- | --- | --- |
| 響應式網站 | 分開選擇平台及 MP4／MP3／PNG；英文介面 | 桌面瀏覽器流程已驗證 |
| Facebook／Instagram／TikTok／YouTube | 由內附的 Cobalt 解析公開媒體 | YouTube 無 cookies MP4／MP3 已驗證；其他相容性視平台改動而定 |
| Threads 轉接器 | 匿名精確貼文解析及本機 FFmpeg 轉換 | 指定貼文已驗證 MP4、MP3、PNG |
| 檔案串流 | 60 秒單次連結、格式及大小限制，不建立媒體庫 | 已用 `ffprobe` 檢查可播放格式 |
| Profile Research Mode | Instagram／Threads／TikTok profile 掃描 → 選擇 posts → 摘要 → GitHub repo 驗證清單 | 只研究公開 metadata；會標示 provider／登入限制 |
| 部署檔案 | Node 伺服器、可選 Docker Compose、CI 及 Pages workflow | Pages 只提供靜態介面 |

Profile Research Mode 會枚舉公開貼文 metadata 作研究，**不會**批量下載整個帳戶媒體。不提供私人貼文、Stories、followers 抓取、瀏覽器憑證上傳、CAPTCHA／DRM 繞過或批量 ZIP。

請貼上個別公開貼文或 Reel 網址。從 Instagram profile 內複製的 `/username/reel/post-id/` 連結會自動轉成標準網址；貼上 profile 網址不會下載整個帳號。

## 本機開始

最簡單的完整啟動方式：

```sh
docker compose up --build
```

開啟 `http://localhost:3000`。

Docker 不是必要條件。無 Docker 時須安裝 FFmpeg，再依 [Cobalt 官方指南](https://github.com/imputnet/cobalt/blob/main/docs/run-an-instance.md)以 Node.js、Git、pnpm 啟動 Cobalt，設定 `.env` 的 `COBALT_URL`，最後執行 `npm start`。

### 手動設定 Cobalt

依照 [Cobalt 官方指南](https://github.com/imputnet/cobalt/blob/main/docs/run-an-instance.md)部署你控制的實例，再修改 `.env`：

```dotenv
COBALT_URL=https://YOUR-OWN-COBALT-HOST/
COBALT_API_KEY=
```

以上主機名稱只是佔位符。Compose 已包含固定映像版本的 Cobalt 及 FFmpeg。

一般公開 YouTube 影片已在沒有 cookies 的情況下成功下載 MP4 及 MP3。部分受限制的公開內容可能要求登入；如確有需要，只在你控制的 Cobalt 內依官方 `COOKIE_PATH` 設定管理 `cookies.json`。網站不接受或儲存訪客 cookies。

Threads 不使用已設定的登入／session，但不代表所有貼文均可匿名取得。遇到拒絕存取、登入要求、限流、頁面改版或沒有可下載媒體時，解析可能失敗。

## 架構

```text
靜態網站介面（GitHub Pages 或其他主機）
  -> 你的 Node.js API
     -> Facebook／Instagram／TikTok／YouTube：自架 Cobalt
     -> Threads：實驗性匿名公開 HTML 解析器
     -> FFmpeg：PNG／MP3 轉換
  -> 短時下載票證 -> 有大小限制的媒體串流
```

[GitHub Pages 是靜態網站服務](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)，不能執行這個 Node API。手動 Pages workflow 只發佈 `web/`。你需要在 `web/config.js` 設定公開 API origin，並在後端設定正確的前端來源。不要公開下載媒體、`.env`、cookies 或 keys。

## 文件導覽

| 主題 | 繁體中文 | English |
| --- | --- | --- |
| 部署及設定 | [部署](docs/zh-TW/deployment.md) | [Deployment](docs/en/deployment.md) |
| 授權及外部服務 | [授權](docs/zh-TW/licensing.md) | [Licensing](docs/en/licensing.md) |
| 研究與證據限制 | [研究](docs/zh-TW/research.md) | [Research](docs/en/research.md) |
| Profile Research Mode | [Profile 研究](docs/zh-TW/profile-research.md) | [Profile research](docs/en/profile-research.md) |
| 測試範圍及上線清單 | [驗證](docs/zh-TW/verification.md) | [Verification](docs/en/verification.md) |
| 搜尋與 AI 可見度 | [GEO](docs/GEO.md) | [GEO](docs/GEO.md) |
| 安全及回報 | [安全](SECURITY.zh-TW.md) | [Security](SECURITY.md) |
| 參與開發 | [參與](CONTRIBUTING.zh-TW.md) | [Contributing](CONTRIBUTING.md) |
| 更新記錄 | [更新記錄](CHANGELOG.zh-TW.md) | [Changelog](CHANGELOG.md) |

## 授權與署名

DL Anything You Want 原創程式與文件採用 [MIT License](LICENSE)，署名為 **2026 jacbus1 and DL Anything You Want contributors**。再分發主要部分時須保留版權及許可聲明。

外部服務及工具保留其原有授權。此 repo 沒有內嵌 Cobalt：其 API 為 AGPL-3.0；官方網站前端為 CC-BY-NC-SA-4.0。本專案不分發該前端、字型或品牌資產。詳見 [第三方授權](THIRD_PARTY_NOTICES.zh-TW.md)及 [授權說明](docs/zh-TW/licensing.md)；以 HTTP 分開服務不等於全面法律豁免。

只下載自己擁有或已取得許可的內容，並核對平台及主機規則。公開貼文不代表可任意再發佈；權利確認勾選框不是許可證明。本專案與 Meta、Instagram、Threads 或 Cobalt 無隸屬關係；專案名稱尚未完成商標清查。

`package.json` 的 `private: true` 是避免誤發佈到 npm，**不代表 GitHub repo 是私人**。
