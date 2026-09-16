# FramePocket

[English](README.md) | **繁體中文**

可自架的公開媒體下載研究原型，用於儲存有權下載的 Instagram 相片／影片，並試驗 Threads 貼文影片解析。網站介面目前使用繁體中文；中英文文件分開維護。

> **這是原型，不是已驗證的正式下載服務。** Instagram 需要你自架的 Cobalt API；Threads 解析仍屬實驗性。公開原始碼或發佈網站介面，不代表下載後端已上線。

## 包含甚麼

| 部分 | 已實作 | 驗證邊界 |
| --- | --- | --- |
| 響應式網站 | 貼上連結、權利確認、檔案選擇、明確標示的示範模式 | 響應式 CSS；本輪無法重跑瀏覽器，未測實機儲存 |
| Instagram 轉接器 | 處理自架 Cobalt 的相片、影片、Reels、混合輪播回應 | 合成回應測試；未驗證真實 Cobalt／Instagram |
| Threads 轉接器 | 匿名 HTML／JSON／OG 解析，核對所要求的貼文 ID | 只有合成 HTML 測試；未驗證真實下載 |
| 檔案串流 | 60 秒單次連結、格式及大小限制，不建立應用程式媒體庫 | 模擬上游 bytes；不是可播放影片測試 |
| 部署檔案 | Node 伺服器、Docker、CI 及手動 Pages workflow | Docker、Pages 與公開 API 仍待驗證 |

不提供整個帳號抓取、私人貼文、Stories、登入、cookies 上傳、CAPTCHA／DRM 繞過、轉檔、續傳或批量 ZIP。示範模式只顯示三個合成項目，儲存按鈕停用。

## 本機開始

需要 Node.js 22 或相容的較新版本，無須安裝第三方 npm 套件。請在此原始碼匯入分支（或本 PR 合併後）的 repo 根目錄執行以下指令。

```sh
cp .env.example .env
npm run check
npm test
npm start
```

開啟 `http://localhost:3000`。

未設定 `COBALT_URL` 時仍可查看示範介面；Instagram 請求會返回 `ENGINE_NOT_CONFIGURED`，不會偽造下載結果。

### 設定 Instagram 引擎

依照 [Cobalt 官方指南](https://github.com/imputnet/cobalt/blob/main/docs/run-an-instance.md)部署你控制的實例，再修改 `.env`：

```dotenv
COBALT_URL=https://YOUR-OWN-COBALT-HOST/
COBALT_API_KEY=
```

以上主機名稱只是佔位符，不是已提供的服務。請使用實例根網址，不是 `/api/resolve`。是否需要 key 取決於你的實例設定；秘密資料只放後端，不能放進 `web/config.js`。附帶的 Compose 只啟動 FramePocket，不包含 Cobalt。

Threads 不使用已設定的登入／session，但不代表所有貼文均可匿名取得。遇到拒絕存取、登入要求、限流、頁面改版或沒有影片時，解析可能失敗。

## 架構

```text
靜態網站介面（GitHub Pages 或其他主機）
  -> 你的 Node.js API
     -> Instagram：你自架的 Cobalt
     -> Threads：實驗性匿名公開 HTML 解析器
  -> 短時下載票證 -> 有大小限制的媒體串流
```

[GitHub Pages 是靜態網站服務](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)，不能執行這個 Node API。手動 Pages workflow 只發佈 `web/`。你需要在 `web/config.js` 設定公開 API origin，並在後端設定正確的前端來源。不要公開下載媒體、`.env`、cookies 或 keys。

## 文件導覽

| 主題 | 繁體中文 | English |
| --- | --- | --- |
| 部署及設定 | [部署](docs/zh-TW/deployment.md) | [Deployment](docs/en/deployment.md) |
| 授權及外部服務 | [授權](docs/zh-TW/licensing.md) | [Licensing](docs/en/licensing.md) |
| 研究與證據限制 | [研究](docs/zh-TW/research.md) | [Research](docs/en/research.md) |
| 測試範圍及上線清單 | [驗證](docs/zh-TW/verification.md) | [Verification](docs/en/verification.md) |
| 安全及回報 | [安全](SECURITY.zh-TW.md) | [Security](SECURITY.md) |
| 參與開發 | [參與](CONTRIBUTING.zh-TW.md) | [Contributing](CONTRIBUTING.md) |
| 更新記錄 | [更新記錄](CHANGELOG.zh-TW.md) | [Changelog](CHANGELOG.md) |

## 授權與署名

FramePocket 原創程式與文件採用 [MIT License](LICENSE)，署名為 **2026 jacbus1 and FramePocket contributors**。再分發主要部分時須保留版權及許可聲明。

外部服務及工具保留其原有授權。此 repo 沒有內嵌 Cobalt：其 API 為 AGPL-3.0；官方網站前端為 CC-BY-NC-SA-4.0。本專案不分發該前端、字型或品牌資產。詳見 [第三方授權](THIRD_PARTY_NOTICES.zh-TW.md)及 [授權說明](docs/zh-TW/licensing.md)；以 HTTP 分開服務不等於全面法律豁免。

只下載自己擁有或已取得許可的內容，並核對平台及主機規則。公開貼文不代表可任意再發佈；權利確認勾選框不是許可證明。本專案與 Meta、Instagram、Threads 或 Cobalt 無隸屬關係；專案名稱尚未完成商標清查。

`package.json` 的 `private: true` 是避免誤發佈到 npm，**不代表 GitHub repo 是私人**。
