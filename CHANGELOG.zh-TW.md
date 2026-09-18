# 更新記錄


## GitHub 搜尋資訊 0.4.2 — 2026-09-18

- GitHub 專案定位改為 Social Media Downloader & Converter。
- 在專案及網站 metadata 加入 Facebook（FB）、Instagram（IG）、Threads、YouTube、TikTok 搜尋字詞。
- 網站及 GitHub 預設維持英文。

## 媒體輸出 0.4.1 — 2026-09-18

- 介面統一為英文，只保留 MP4、MP3、PNG。
- 移除 TEXT 轉錄、語言選擇、whisper.cpp 及內附模型。
- 保留 FFmpeg 處理 MP3 與 PNG，縮小 Docker 映像及建置時間。

## 多語 TEXT 0.4.0 — 2026-09-18

- 加入本機多語語音轉文字，可自動偵測，亦可指定中文、粵語、英、日、韓、西、法、德語。
- Docker app 映像內建固定版本 whisper.cpp 1.9.4 及經 checksum 驗證的 tiny 多語模型。
- 轉換成功並驗證檔案後才回傳下載 headers，避免 FFmpeg 失敗時得到 200 空檔。
- 加入 TEXT 輸出及正確的中英文準備／錯誤文案。


## 下載及轉換器 0.3.0 — 2026-09-18

- 加入 YouTube watch、短網址、Shorts 及 live 網址，由自架 Cobalt 處理。
- 平台與輸出格式分開選擇；在有相應媒體時提供 MP4 影片、MP3 音訊及 PNG 圖片。
- 使用 FFmpeg 轉換 PNG 及 Threads MP3，並嚴格核對平台與格式。
- 已在無 cookies 情況下驗證 YouTube MP4／MP3，亦驗證 Threads PNG／MP3 轉換。

[English](CHANGELOG.md) | **繁體中文**

## 原始碼匯入 — 2026-09-16

- 從雙語程式包匯入原創 Node API、繁體中文介面、fixtures、Docker 檔案及只發佈靜態內容的手動 Pages workflow。
- CI 使用 Node 22／24 執行語法與單元／本機 HTTP 測試，另加 Docker Compose 健康及首頁測試。
- 修正非同步讀取 body 後的解析併發上限，拒絕互相矛盾的 Threads OG／canonical 身份，加入回歸測試。
- 分開記錄最新本機證據、無法執行的 Docker／瀏覽器檢查，以及未驗證的真實平台相容性。

## 文件準備 — 2026-09-15（America/Toronto）

- 把初始簡介改成獨立英文／繁體中文 README。
- 加入 MIT License，署名 jacbus1 and DL Anything You Want contributors。
- 加入分開的雙語第三方聲明、授權、部署、研究、驗證、安全及參與指南。
- 明確標示 repo 在可執行程式匯入前只有文件。

程式包已另外整理，74 項本機測試及語法檢查通過。程式碼上傳被連接工具的安全檢查攔截，此 PR 不包含執行程式或 workflows。沒有宣稱真實平台下載、Docker、實機或公開服務已驗證／部署。