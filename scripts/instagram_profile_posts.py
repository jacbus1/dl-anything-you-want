#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
import json
import os
import sys

try:
    import instaloader
except Exception as exc:
    print(f"PROFILE_DEPENDENCY_MISSING: {exc}", file=sys.stderr)
    sys.exit(78)

def fail(code, exc):
    print(f"{code}: {exc}", file=sys.stderr)
    sys.exit(2)

if len(sys.argv) != 3:
    fail("PROFILE_ARGUMENT_ERROR", "usage: instagram_profile_posts.py USERNAME MAX_POSTS")

username=sys.argv[1]
try:
    max_posts=int(sys.argv[2])
except ValueError as exc:
    fail("PROFILE_ARGUMENT_ERROR", exc)

sessionfile=os.environ.get("INSTAGRAM_SESSIONFILE","").strip()
session_username=os.environ.get("INSTAGRAM_SESSION_USERNAME","").strip()
if bool(sessionfile) != bool(session_username):
    fail("PROFILE_SESSION_CONFIG", "session file and session username must be configured together")

L=instaloader.Instaloader(
    download_pictures=False,
    download_videos=False,
    download_video_thumbnails=False,
    download_geotags=False,
    download_comments=False,
    save_metadata=False,
    compress_json=False,
    quiet=True,
)
authenticated=False
try:
    if sessionfile:
        L.load_session_from_file(session_username, filename=sessionfile)
        authenticated=True
    profile=instaloader.Profile.from_username(L.context, username)
except instaloader.exceptions.ProfileNotExistsException as exc:
    fail("PROFILE_NOT_FOUND", exc)
except instaloader.exceptions.LoginRequiredException as exc:
    fail("PROFILE_LOGIN_REQUIRED", exc)
except Exception as exc:
    fail("PROFILE_INIT_FAILED", exc)

posts=[]
try:
    for index, post in enumerate(profile.get_posts()):
        if index >= max_posts:
            break
        caption=""
        try:
            caption=post.caption or ""
        except Exception:
            caption=""
        posts.append({
            "shortcode": post.shortcode,
            "url": f"https://www.instagram.com/p/{post.shortcode}/",
            "date_utc": post.date_utc.isoformat().replace("+00:00","Z"),
            "caption": caption,
            "typename": getattr(post,"typename",""),
            "is_video": bool(getattr(post,"is_video",False)),
        })
except instaloader.exceptions.LoginRequiredException as exc:
    fail("PROFILE_LOGIN_REQUIRED", exc)
except Exception as exc:
    fail("PROFILE_POSTS_FAILED", exc)

media_count=int(getattr(profile,"mediacount",len(posts)) or len(posts))
result={
    "username": profile.username,
    "full_name": getattr(profile,"full_name","") or "",
    "biography": getattr(profile,"biography","") or "",
    "external_url": getattr(profile,"external_url",None) or "",
    "media_count": media_count,
    "authenticated": authenticated,
    "posts": posts,
    "truncated": len(posts) < media_count,
}
print(json.dumps(result, ensure_ascii=False))
