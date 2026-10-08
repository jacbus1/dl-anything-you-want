# Instagram Reel Reader — ChatGPT + GitHub integration

This repository includes a reusable public-Instagram video capture and review pipeline.

## How ChatGPT can start it

Repository: jacbus1/dl-anything-you-want

1. Validate that a pasted link points to a PUBLIC Instagram reel, post or TV short-code.
2. Using the connected GitHub create_file action, create one file named
   review-requests/YYYYMMDDTHHMMSS-SHORTCODE.json (unique per request) on main.
   Its content is JSON with one key "url", pointing to that public Instagram link.
3. GitHub Actions detects the new request and starts the workflow called
   Read Instagram Reel (.github/workflows/instagram-reader.yml).
4. Fetch the repository's Actions runs through the connected GitHub fetch action:
   https://api.github.com/repos/jacbus1/dl-anything-you-want/actions/runs?per_page=10
   Match the request commit with the run.
5. Fetch workflow jobs and artifacts; download the artifact via the
   connected GitHub download_workflow_artifact action.
6. GitHub places the ZIP into the assistant's working container. Extract it,
   inspect contact-sheet.jpg, individual frames, analysis.json, transcript.txt
   and, if necessary, the source video; then analyze the actual content in chat.

This removes the need to ask the user to manually download videos. The user can
simply paste an Instagram URL along with a request such as "分析這條 Reel".
ChatGPT still must have access to the GitHub connection and artifact file tools.

## Artifact contents

- source.mp4 or another video format: the actual public reel.
- contact-sheet.jpg: visual index with frames every ~3 seconds.
- frames/frame-*.jpg: higher resolution screenshots for reading UI/text.
- transcript.txt: offline multilingual speech transcription via Faster Whisper.
- analysis.json: canonical URL, source information, transcription status.
- error.json: explicit failure if blocked or unavailable.

## Rules / limitations

- Do not claim a video has been reviewed before reading the artifact.
- Do not invent website functionality or claim transcript accuracy without checking.
- Only public media. No private account/login scraping, cookies, captcha or DRM bypass.
- Max video 150 MB; artifacts expire after 2 days.
- This GitHub repo is presently PUBLIC: request URLs and artifacts are NOT private.
  Do not use it for confidential client content or private personal information.
- Instagram may block downloads or change its public site. Fail explicitly when so.
- Normal ChatGPT web search alone cannot replace the connected GitHub file path.
- No persistent server is running. ChatGPT creates each request on demand.

## Direct manual fallback

In the repository Actions tab, select Read Instagram Reel -> Run workflow,
paste the link into the URL field and open the resulting run's artifact.

## True MCP option

If a dedicated custom MCP tool is preferred in future, deploy an authenticated
remote Streamable HTTP MCP server that calls the same public-media capture
module, and connect its URL through ChatGPT Plugins. This GitHub-backed method
needs no permanent server or monthly hosting subscription.
