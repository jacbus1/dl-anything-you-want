# 驗證記錄

[English](../en/verification.md) | **繁體中文** | [README](../../README.zh-TW.md)

> **文件階段：可執行程式尚未匯入 repo。** 技術及部署說明適用於另行準備的程式包，不代表此分支已包含程式或已上線。

首版準備：2026-09-15 America/Toronto；runtime 的 UTC 時間可能顯示 2026-09-16。

## 已記錄範圍

修改前已重新執行既有 69 項 Node 單元／本機 HTTP 測試，全部通過。另行準備的程式包新增五項 repo／文件檢查；最後本機結果記於 [local-tests.json](../local-tests.json)。取得程式包後，可執行 `npm test` 及 `npm run check` 重現。這個只有文件的 PR 不包含可執行測試或 CI workflows；本機通過不等於 GitHub CI 已通過。

解析器測試使用虛構貼文 ID 及合成 Cobalt／HTML 回應。本機 HTTP 測試啟動真實 loopback server，但注入模擬媒體／解析器；標成 `video/mp4` 的測試 bytes 不是可播放影片測試。程式包的 repo 測試核對套件／署名、雙語文件／相對連結及手動 Pages 只發佈靜態內容。

原型先前的離線瀏覽器排版檢查屬歷史記錄，不是本次修改後重跑的證據。該歷史壓縮包的截圖／瀏覽器報告沒有打包進 repo；本次不宣稱新的瀏覽器或實機測試通過。

| 工作 | 狀態 |
| --- | --- |
| 程式包：Node 單元／本機 HTTP 及 repo 檢查 | 詳見本機結果檔 |
| 程式包：JavaScript 語法 | 詳見本機結果檔 |
| 本文件 PR 的相對 Markdown 連結 | 已在本機檢查 86 個 |
| 真實 Instagram／已部署 Cobalt | 未測試 |
| 真實 Threads 解析／下載 | 未測試 |
| 加入 GitHub 導覽連結後的瀏覽器回歸 | 未測試 |
| Docker build／執行 | 未測試 |
| 真實 iPhone／Android 儲存 | 未測試 |
| Pages／公開 API 營運 | 本次文件變更沒有驗證 |
| 獨立安全／法律審計 | 未進行 |

## 宣稱服務上線前

測試自己擁有／獲授權的 Instagram 相片、Reel、混合輪播，Threads 單一／多影片及無影片貼文，拒絕存取／登入要求／已刪除／429 回應，以及 MIME、真實內容、大小、時長、瀏覽器完成儲存、過期票證、限額、CORS、TLS。記錄主機區域、時間、commit、Cobalt 版本及真實裝置／瀏覽器。不可把私人網址、cookies、keys 或下載媒體提交為測試證據。

公開 repo、合併原始碼、CI 成功、靜態網站部署是不同里程碑，任何一項都不單獨證明媒體已可成功下載。
