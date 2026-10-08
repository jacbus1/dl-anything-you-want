#!/usr/bin/env python3
"""Prepare an Instagram Reel for visual + speech analysis. Public posts only.

Input: single Instagram post/reel URL via --url, --request JSON file or GitHub
Actions push/workflow_dispatch event. Output: inspectable video, screenshots,
contact sheet, transcript, and metadata. No authentication or DRM bypass.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import traceback
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SAFE_ID = re.compile(r"^[A-Za-z0-9_-]{5,40}$")
KINDS = {"reel", "p", "tv"}
HOSTS = {"instagram.com", "www.instagram.com", "m.instagram.com"}
MAX_BYTES = 150 * 1024 * 1024


def normalize_instagram_url(raw: str) -> tuple[str, str]:
    parsed = urlsplit(raw.strip())
    if parsed.scheme not in {"http", "https"} or parsed.hostname not in HOSTS:
        raise ValueError("Only public instagram.com post/reel URLs are supported.")
    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) != 2 or parts[0] not in KINDS or not SAFE_ID.fullmatch(parts[1]):
        raise ValueError("Expected URL format: https://www.instagram.com/reel/SHORTCODE/")
    return f"https://www.instagram.com/{parts[0]}/{parts[1]}/", parts[1]


def event_input() -> tuple[str, str]:
    event_name = os.environ.get("GITHUB_EVENT_NAME")
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        raise ValueError("Missing GITHUB_EVENT_PATH")
    event = json.loads(Path(event_path).read_text())
    if event_name == "workflow_dispatch":
        inputs = event.get("inputs") or {}
        return str(inputs.get("url", "")), str(inputs.get("request_id", "manual"))
    if event_name == "push":
        added = (event.get("head_commit") or {}).get("added", [])
        modified = (event.get("head_commit") or {}).get("modified", [])
        paths = [p for p in added + modified
                 if re.fullmatch(r"review-requests/[A-Za-z0-9_-]+\.json", p)]
        if len(paths) != 1:
            # GitHub's push payload can omit changed-path arrays for some
            # GitHub App commits. Checkout fetch-depth=2 gives a reliable diff.
            changed = subprocess.run(
                ["git", "diff", "--name-only", "HEAD^", "HEAD"],
                cwd=ROOT, capture_output=True, text=True, check=True)
            paths = [p for p in changed.stdout.splitlines()
                     if re.fullmatch(r"review-requests/[A-Za-z0-9_-]+\.json", p)]
        if len(paths) != 1:
            raise ValueError(f"Expected one review-requests/*.json file; found {len(paths)}")
        req = json.loads((ROOT / paths[0]).read_text())
        return str(req.get("url", "")), Path(paths[0]).stem
    raise ValueError(f"Unsupported event: {event_name}")


def run(args: list[str], timeout: int = 240) -> None:
    subprocess.run(args, check=True, timeout=timeout)


def screenshot_and_contact_sheet(video: Path, out: Path) -> int:
    import imageio_ffmpeg
    from PIL import Image, ImageDraw, ImageOps

    frames = out / "frames"
    frames.mkdir(exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    run([ffmpeg, "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
         "-i", str(video), "-vf", "fps=1/3,scale=720:-2",
         "-frames:v", "60", str(frames / "frame-%03d.jpg")], timeout=150)
    files = sorted(frames.glob("frame-*.jpg"))
    if not files:
        raise RuntimeError("The video downloaded but no frames were generated.")
    cols = 4
    tile_width, tile_height = 232, 450
    rows = (len(files) + cols - 1) // cols
    canvas = Image.new("RGB", (cols * tile_width, rows * tile_height), "#111827")
    draw = ImageDraw.Draw(canvas)
    for i, path in enumerate(files):
        with Image.open(path) as im:
            thumb = ImageOps.contain(im.convert("RGB"), (tile_width - 8, tile_height - 28))
            x = (i % cols) * tile_width + (tile_width - thumb.width) // 2
            y = (i // cols) * tile_height + 24
            canvas.paste(thumb, (x, y))
            draw.text(((i % cols) * tile_width + 9, (i // cols) * tile_height + 5),
                      f"~{i*3}s", fill="#ffffff")
    canvas.save(out / "contact-sheet.jpg", quality=85)
    return len(files)


def transcribe(video: Path, out: Path) -> dict:
    """Best-effort multilingual ASR; explicit error when unavailable."""
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel("base", device="cpu", compute_type="int8", cpu_threads=2)
        segments, info = model.transcribe(str(video), beam_size=2,
                                          vad_filter=True, condition_on_previous_text=False)
        rows = []
        for s in segments:
            text = s.text.strip()
            if text:
                rows.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": text})
        transcript = "\n".join(f"[{r['start']:06.1f}-{r['end']:06.1f}] {r['text']}" for r in rows)
        (out / "transcript.txt").write_text(transcript if transcript else "[No speech detected]\n")
        return {"status": "completed", "language": info.language, "segments": rows}
    except Exception as exc:
        (out / "transcript.txt").write_text(
            "[Automatic transcription unavailable; inspect video/audio directly.]\n"
            f"Reason: {type(exc).__name__}: {str(exc)[:300]}\n")
        return {"status": "unavailable", "reason": f"{type(exc).__name__}: {str(exc)[:300]}"}


def process(raw_url: str, request_id: str, out: Path, skip_asr: bool = False) -> dict:
    url, shortcode = normalize_instagram_url(raw_url)
    out.mkdir(parents=True, exist_ok=True)
    result = {
        "request_id": request_id[:80],
        "url": url, "shortcode": shortcode,
        "source": "public Instagram Reel/post",
        "status": "processing",
        "warnings": ["Public media only; no login, cookie, paywall or DRM bypass.",
                     "Transcript is automatic and may contain errors."]
    }
    (out / "analysis.json").write_text(json.dumps(result, ensure_ascii=False, indent=2))
    cmd = [sys.executable, "-m", "yt_dlp", "--no-playlist", "--no-warnings",
           "--no-call-home", "--socket-timeout", "20", "--retries", "2",
           "--max-filesize", "150M", "--write-info-json",
           "--output", str(out / "source.%(ext)s"), url]
    run(cmd, timeout=240)
    videos = [p for p in out.glob("source.*")
              if p.suffix.lower() in {".mp4", ".mkv", ".webm", ".mov"}]
    if len(videos) != 1:
        raise RuntimeError(f"Expected one video file, found {len(videos)}")
    video = videos[0]
    if video.stat().st_size > MAX_BYTES:
        video.unlink()
        raise ValueError("Video exceeds the 150 MB maximum.")
    info_path = out / "source.info.json"
    info = json.loads(info_path.read_text()) if info_path.exists() else {}
    # Do not redistribute the raw yt-dlp metadata containing unrelated fields.
    if info_path.exists():
        info_path.unlink()
    result["video_file"] = video.name
    result["video_bytes"] = video.stat().st_size
    result["video_info"] = {k: info.get(k) for k in
                            ("title", "uploader", "duration", "upload_date", "webpage_url")
                            if info.get(k) is not None}
    result["video_info"]["description"] = str(info.get("description") or "")[:3000]
    result["frame_count"] = screenshot_and_contact_sheet(video, out)
    result["transcription"] = ({"status": "skipped"} if skip_asr else transcribe(video, out))
    if skip_asr:
        (out / "transcript.txt").write_text("[Transcription disabled]\n")
    result["status"] = "ready"
    (out / "analysis.json").write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(json.dumps({"status": result["status"], "shortcode": shortcode,
                      "frames": result["frame_count"],
                      "transcription": result["transcription"]["status"]}))
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="")
    parser.add_argument("--request", type=Path)
    parser.add_argument("--out", type=Path, default=Path("review-output"))
    parser.add_argument("--skip-asr", action="store_true")
    args = parser.parse_args()
    try:
        if args.request:
            req = json.loads(args.request.read_text())
            url, request_id = req["url"], args.request.stem
        elif args.url:
            url, request_id = args.url, "manual"
        else:
            url, request_id = event_input()
        process(url, request_id, args.out, skip_asr=args.skip_asr)
        return 0
    except Exception as exc:
        args.out.mkdir(parents=True, exist_ok=True)
        (args.out / "error.json").write_text(json.dumps({
            "status": "failed", "error": f"{type(exc).__name__}: {exc}"
        }, indent=2))
        print(f"Reel analysis FAILED: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
