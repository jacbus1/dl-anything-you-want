# 第三方授權聲明

[English](THIRD_PARTY_NOTICES.md) | **繁體中文**

[MIT License](LICENSE) 適用於 DL Anything You Want 原創內容，不會取代其他服務、執行環境、工具或媒體的授權。本 repo 不包含上游下載器原始碼、第三方前端、字型檔、平台媒體或憑證。

| 部件 | 使用關係 | 授權／原始來源 |
| --- | --- | --- |
| Cobalt API | Facebook、Instagram、TikTok、YouTube 轉接器使用的獨立自架服務；沒有內嵌 | [AGPL-3.0](https://github.com/imputnet/cobalt/blob/main/api/LICENSE) |
| FFmpeg | Docker app 映像從 Debian 安裝，用於 PNG／MP3 轉換 | [FFmpeg 法律及授權資料](https://ffmpeg.org/legal.html)；實際條款視 Debian build 設定而定 |
| Cobalt 官方前端 | 沒有使用或分發；沒有複製品牌／字型資產 | [CC-BY-NC-SA-4.0 及個別資產條件](https://github.com/imputnet/cobalt/blob/main/web/README.md) |
| Node.js | 執行環境；由基礎映像另外取得 | [Node.js 授權及第三方聲明](https://github.com/nodejs/node/blob/main/LICENSE) |
| Node Docker 映像／作業系統套件 | 外部部署環境，不受本專案 MIT 聲明涵蓋 | [官方映像來源](https://github.com/nodejs/docker-node)；核對實際映像內各部件授權 |
| Instaloader 4.15.3 | Python library，用於枚舉公開 Instagram profile 貼文 metadata；可使用 operator-owned session | [MIT](https://github.com/instaloader/instaloader/blob/master/LICENSE) |
| yt-dlp 2026.8.19 | Python／CLI 工具，用於 TikTok 公開 profile metadata 枚舉 | [Unlicense；個別 bundled component 可能不同](https://github.com/yt-dlp/yt-dlp/blob/master/LICENSE) |
| Apify Threads provider | 可選外部 provider，用於公開 Threads profile 枚舉；token 由 operator 提供 | [Provider 條款／actor 文件](https://apify.com/) |
| GitHub Actions | GitHub 執行 CI／部署時取得，不是網站執行依賴 | [checkout](https://github.com/actions/checkout/blob/main/LICENSE)、[setup-node](https://github.com/actions/setup-node/blob/main/LICENSE)、[configure-pages](https://github.com/actions/configure-pages/blob/main/LICENSE)、[upload-pages-artifact](https://github.com/actions/upload-pages-artifact/blob/main/LICENSE)、[deploy-pages](https://github.com/actions/deploy-pages/blob/main/LICENSE) |

第三方 npm 執行依賴：**沒有**。研究文件提及的專案只是參考，並非已安裝依賴。

正式部署時應核對使用的上游版本／映像。修改或分發第三方部件時，保留適用的版權、授權及對應原始碼義務。獨立架設 Cobalt 不足以證明所有整合方式均已合規。DL Anything You Want 的授權不授予第三方商標或下載媒體的使用權。

Cobalt 授權說明核查日期：2026-09-15（America/Toronto）。連結指向上游分支，內容可能更新。部署前請閱讀 [授權說明](docs/zh-TW/licensing.md)。
