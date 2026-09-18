# 部署說明

[English](../en/deployment.md) | **繁體中文** | [README](../../README.zh-TW.md)

公開 repo 與建立可用的下載服務是兩件事。原始碼目的地為 `jacbus1/framepocket`，目前沒有預設後端地址。預期 Pages 網址 `https://jacbus1.github.io/framepocket/` **須待 Pages 成功部署才成立**，不是已上線聲明。

## 本機開發

使用 Node.js 22 或相容的較新版本。複製 `.env.example` 為 `.env`，依次執行 `npm run check`、`npm test`、`npm start`，開啟 `http://localhost:3000`。沒有需要 npm install 的執行依賴。

| 變數 | 預設 | 意義 |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | 監聽位置；容器內設定 `0.0.0.0` |
| `PORT` | `3000` | API 及本機介面連接埠 |
| `PUBLIC_ORIGIN` | `http://localhost:3000` | 營運者的公開 API origin；不會自動設定 DNS／TLS |
| `ALLOWED_ORIGINS` | 公開 API origin | 逗號分隔的前端 origins，不能含路徑 |
| `COBALT_URL` | 空白 | 你控制的 Cobalt 根網址 |
| `COBALT_API_KEY` | 空白 | 該服務要求時填入，只存後端 |
| `MAX_FILE_MB` | `100` | 以 MiB 計算的大小上限；最高可設定 500 |

## 引擎及 API 主機

依 [官方說明](https://github.com/imputnet/cobalt/blob/main/docs/run-an-instance.md)獨立部署 Cobalt，核對並鎖定上游版本及授權。附帶 Compose **只啟動 FramePocket**。Cobalt 返回的 tunnel 網址必須可由 Node API 連接。Docker 的 localhost 指同一容器，不是其他服務或宿主機。

```sh
cp .env.example .env
# 先設定自己的主機及秘密資料。
docker compose up --build
```

本輪尚未驗證 Docker build／容器執行。宿主機連接埠只綁定 loopback；公開前應加上經審查的 HTTPS gateway 及對外連線控制。不要向匿名訪客分享私人 Meta session。

以下除 repo 擁有者的 Pages origin 外，主機名稱均為佔位符：

```dotenv
PUBLIC_ORIGIN=https://YOUR-API-HOST
ALLOWED_ORIGINS=https://jacbus1.github.io
COBALT_URL=https://YOUR-OWN-COBALT-HOST/
COBALT_API_KEY=
MAX_FILE_MB=100
```

`/framepocket/` 的瀏覽器 Origin 是 `https://jacbus1.github.io`，不含專案路徑。同一 origin 下的其他專案網站亦共用這個 CORS 邊界；獨立自訂網域才有獨立 origin。CORS 不是身分驗證。

## 連接前端

修改 `web/config.js`，只放公開 HTTPS API origin：

```js
window.FRAMEPOCKET_CONFIG = Object.freeze({
  apiBase: 'https://YOUR-API-HOST'
});
```

不可加入任何秘密資料。留空 `apiBase` 代表使用目前網站 origin，適合內附 Node 伺服器，不適合沒有 API 的 Pages 網站。

## 審閱後發佈 Pages

合併首版 PR 後，到 repo 的 Settings → Pages，選 **GitHub Actions**。再到 Actions 從 `main` 手動執行 **Publish frontend to Pages**。workflow 會先做檢查及測試，只上傳 `web/`，不建立 Cobalt、API 或 API 的 DNS／TLS，亦不會每次 push 都自動部署。

官方參考：[Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)、[發佈來源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

不要用 repo、Pages 或 Actions artifacts 儲存下載媒體。營運前核對主機／平台條款及上游授權，設定流量與防濫用限制、私人漏洞回報渠道。本機記憶體限流／票證儲存只適用單程序；反向代理、多副本需要額外設計。請閱讀 [安全說明](../../SECURITY.zh-TW.md)並完成 [真實驗證](verification.md)。
