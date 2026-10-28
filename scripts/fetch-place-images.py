#!/usr/bin/env python3
"""Download landmark thumbnails from Wikipedia/Wikimedia Commons.

Run from the project root:
    python3 scripts/fetch-place-images.py

The generated files are stored in frontend/public/images/places and the
attribution metadata in frontend/public/images/CREDITS.md / image-credits.json.
The script batches metadata API calls to remain friendly to Wikimedia's API.
"""
from __future__ import annotations

import html
import io
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "frontend" / "public" / "images" / "places"
OUT_DIR.mkdir(parents=True, exist_ok=True)
UA = "TravelMatePrototype/1.0 (educational full-stack demo; local workspace)"

# Wikipedia's lead image is usually a well-labelled Wikimedia Commons photograph.
# A few places use an exact Commons file name where the article has no lead image.
PLACES = [
    ("fort-aguada", "Fort Aguada", None),
    ("baga-beach", "Baga, Goa", "File:Beautiful Baga Beach.jpg"),
    ("anjuna-beach", "Anjuna", None),
    ("chapora-fort", "Chapora Fort", "File:Walls of Fort Chapora 2 26012016.jpg"),
    ("amber-fort", "Amer Fort", None),
    ("hawa-mahal", "Hawa Mahal", None),
    ("city-palace-jaipur", "City Palace, Jaipur", None),
    ("jal-mahal", "Jal Mahal", None),
    ("taj-mahal", "Taj Mahal", None),
    ("agra-fort", "Agra Fort", None),
    ("mehtab-bagh", "Mehtab Bagh", None),
    ("fatehpur-sikri", "Fatehpur Sikri", None),
    ("munnar-tea-gardens", "Munnar", None),
    ("alleppey-backwaters", "Alappuzha", None),
    ("fort-kochi", "Fort Kochi", None),
    ("periyar-national-park", "Periyar National Park", None),
    ("solang-valley", "Solang Valley", None),
    ("rohtang-pass", "Rohtang Pass", None),
    ("hadimba-temple", "Hidimba Devi Temple", None),
    ("manali", "Manali, Himachal Pradesh", None),
    ("red-fort", "Red Fort", None),
    ("india-gate", "India Gate", None),
    ("qutub-minar", "Qutub Minar", None),
    ("humayuns-tomb", "Humayun's Tomb", None),
]


def api_get(base: str, params: dict) -> dict:
    url = base + "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    last_error = None
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code in (429, 500, 502, 503, 504) and attempt < 4:
                time.sleep(2 ** attempt)
                continue
            raise
    raise last_error  # pragma: no cover


def resolve_title(title: str, mappings: list[dict]) -> str:
    lookup = {item["from"]: item["to"] for item in mappings}
    seen = set()
    while title in lookup and title not in seen:
        seen.add(title)
        title = lookup[title]
    return title


def wikipedia_pageimages(titles: list[str]) -> dict[str, dict]:
    data = api_get(
        "https://en.wikipedia.org/w/api.php",
        {
            "action": "query",
            "titles": "|".join(titles),
            "prop": "pageimages",
            "piprop": "thumbnail|name|original",
            "pithumbsize": "1400",
            "format": "json",
            "redirects": "1",
        },
    )
    query = data.get("query", {})
    mappings = query.get("normalized", []) + query.get("redirects", [])
    by_title = {page.get("title"): page for page in query.get("pages", {}).values()}
    result = {}
    for title in titles:
        resolved = resolve_title(title, mappings)
        page = by_title.get(resolved) or by_title.get(title)
        if page and page.get("pageimage"):
            result[title] = {
                "fileTitle": f"File:{page['pageimage']}",
                "fallbackThumb": page.get("thumbnail", {}).get("source"),
                "resolvedTitle": resolved,
            }
    return result


def commons_files(file_titles: list[str]) -> dict[str, dict]:
    data = api_get(
        "https://commons.wikimedia.org/w/api.php",
        {
            "action": "query",
            "titles": "|".join(file_titles),
            "prop": "imageinfo",
            "iiprop": "url|extmetadata",
            "iiurlwidth": "1400",
            "format": "json",
        },
    )
    query = data.get("query", {})
    mappings = query.get("normalized", []) + query.get("redirects", [])
    by_title = {page.get("title"): page for page in query.get("pages", {}).values()}
    result = {}
    for file_title in file_titles:
        resolved = resolve_title(file_title, mappings)
        page = by_title.get(resolved) or by_title.get(file_title)
        info = (page or {}).get("imageinfo", [{}])[0]
        result[file_title] = {
            "fileTitle": (page or {}).get("title", file_title),
            "thumbUrl": info.get("thumburl") or info.get("url"),
            "descriptionUrl": info.get("descriptionurl"),
            "metadata": info.get("extmetadata", {}),
        }
    return result


def plain(value: str | None) -> str:
    if not value:
        return "Wikimedia Commons contributor"
    text = re.sub(r"<[^>]+>", " ", value)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text or "Wikimedia Commons contributor"


def save_jpeg(url: str, path: Path) -> tuple[int, int]:
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    last_error = None
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                raw = response.read()
            break
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code in (429, 500, 502, 503, 504) and attempt < 4:
                time.sleep(2 ** attempt)
                continue
            raise
    else:  # pragma: no cover
        raise last_error
    image = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
    image.thumbnail((1400, 1000), Image.Resampling.LANCZOS)
    image.save(path, "JPEG", quality=86, optimize=True, progressive=True)
    return image.size


def main() -> None:
    articles = [article for _, article, _ in PLACES]
    print("Fetching Wikipedia page images in one API request...")
    wiki = wikipedia_pageimages(articles)
    file_titles = []
    for slug, article, forced_file in PLACES:
        file_title = forced_file or wiki.get(article, {}).get("fileTitle")
        if file_title and file_title not in file_titles:
            file_titles.append(file_title)
    print(f"Fetching metadata for {len(file_titles)} Commons files...")
    commons = commons_files(file_titles)

    credits = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "Wikipedia lead images and Wikimedia Commons",
        "images": {},
    }
    failures = []
    for index, (slug, article, forced_file) in enumerate(PLACES, 1):
        file_title = forced_file or wiki.get(article, {}).get("fileTitle")
        if not file_title:
            failures.append((slug, "No Wikipedia lead image"))
            print(f"[{index:02}/{len(PLACES)}] MISSING {slug}")
            continue
        info = commons.get(file_title, {})
        fallback_thumb = wiki.get(article, {}).get("fallbackThumb")
        url = info.get("thumbUrl") or fallback_thumb
        if not url:
            failures.append((slug, "No Commons thumbnail"))
            print(f"[{index:02}/{len(PLACES)}] MISSING {slug} thumbnail")
            continue
        try:
            path = OUT_DIR / f"{slug}.jpg"
            width, height = save_jpeg(url, path)
            meta = info.get("metadata", {})
            author = plain(meta.get("Artist", {}).get("value"))
            license_name = plain(meta.get("LicenseShortName", {}).get("value") or "See Commons page")
            description_url = info.get("descriptionUrl") or (
                "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(file_title.replace(" ", "_"))
            )
            credits["images"][f"{slug}.jpg"] = {
                "place": article,
                "fileTitle": info.get("fileTitle", file_title),
                "author": author,
                "license": license_name,
                "commonsUrl": description_url,
                "articleUrl": "https://en.wikipedia.org/wiki/" + urllib.parse.quote(article.replace(" ", "_")),
                "width": width,
                "height": height,
            }
            print(f"[{index:02}/{len(PLACES)}] {slug:24s} {width}x{height}  {info.get('fileTitle', file_title)}")
        except Exception as exc:  # noqa: BLE001
            failures.append((slug, str(exc)))
            print(f"[{index:02}/{len(PLACES)}] FAILED  {slug}: {exc}")
        time.sleep(0.12)

    (OUT_DIR.parent / "image-credits.json").write_text(
        json.dumps(credits, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    lines = [
        "# Image credits",
        "",
        "Landmark photographs are lead images from Wikipedia articles or files from Wikimedia Commons.",
        "Each image remains under the license listed on its Commons file page. Please preserve the",
        "author and license attribution if you reuse these images in a public deployment.",
        "",
        f"Generated: {credits['generatedAt']}",
        "",
        "| File | Place | Author | License | Source |",
        "| --- | --- | --- | --- | --- |",
    ]
    for filename, item in credits["images"].items():
        author = item["author"].replace("|", "\\|")
        lines.append(
            f"| `{filename}` | {item['place']} | {author} | {item['license']} | "
            f"[Commons]({item['commonsUrl']}) · [Wikipedia]({item['articleUrl']}) |"
        )
    lines += ["", "## Failures", ""]
    if failures:
        lines += [f"- `{slug}`: {error}" for slug, error in failures]
    else:
        lines.append("None.")
    (OUT_DIR.parent / "CREDITS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nSaved {len(credits['images'])} images; {len(failures)} failures.")


if __name__ == "__main__":
    main()
