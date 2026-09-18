# 更新記錄

[English](CHANGELOG.md) | **繁體中文**

## 原始碼匯入 — 2026-09-16

- 從雙語程式包匯入原創 Node API、繁體中文介面、fixtures、Docker 檔案及只發佈靜態內容的手動 Pages workflow。
- CI 使用 Node 22／24 執行語法與單元／本機 HTTP 測試，另加 Docker Compose 健康及首頁測試。
- 修正非同步讀取 body 後的解析併發上限，拒絕互相矛盾的 Threads OG／canonical 身份，加入回歸測試。
- 分開記錄最新本機證據、無法執行的 Docker／瀏覽器檢查，以及未驗證的真實平台相容性。

## 文件準備 — 2026-09-15（America/Toronto）

- 把初始簡介改成獨立英文／繁體中文 README。
- 加入 MIT License，署名 jacbus1 and FramePocket contributors。
- 加入分開的雙語第三方聲明、授權、部署、研究、驗證、安全及參與指南。
- 明確標示 repo 在可執行程式匯入前只有文件。

程式包已另外整理，74 項本機測試及語法檢查通過。程式碼上傳被連接工具的安全檢查攔截，此 PR 不包含執行程式或 workflows。沒有宣稱真實平台下載、Docker、實機或公開服務已驗證／部署。
