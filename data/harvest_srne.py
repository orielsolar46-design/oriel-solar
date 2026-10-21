"""Harvests SRNE product imagery from srnesolar.com.

Every SRNE page embeds the same ~110 site-furniture images (nav, footer,
solution banners). The genuine product shots are the handful UNIQUE to each
detail page, so we fetch every page, build the shared baseline, and keep the
difference. Anything with no unique images is reported rather than guessed at.

Writes:  data/srne-images.json   { product_slug: [image_url, ...] }
"""
import json
import re
import time
import urllib.request
from collections import Counter
from pathlib import Path

BASE = "https://www.srnesolar.com"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
OUT = Path(__file__).parent / "srne-images.json"

IMG = re.compile(r"https://img\.ctmon\.com\.cn/oss/sren/userfiles/[^\"'\s<>]+\.(?:jpg|jpeg|png|webp)", re.I)
LINK = re.compile(r'href="(/productdetail/[^"]+\.html)"')

CATEGORIES = [
    "Inverter", "Low-Voltage-Battery", "High-Voltage-Battery",
    "All-in-One", "Energy-Storage-System", "Charge-Discharge-Controller",
]


def get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode("utf-8", errors="ignore")


# 1. Collect every product detail URL across the categories.
detail_urls = set()
for cat in CATEGORIES:
    try:
        html = get(f"{BASE}/product/{cat}.html")
    except Exception as e:
        print(f"  category {cat}: {e}")
        continue
    found = set(LINK.findall(html))
    detail_urls |= found
    print(f"  {cat}: {len(found)} products")

print(f"\nTotal product pages: {len(detail_urls)}")

# 2. Fetch each page and record its image set.
pages: dict[str, set] = {}
for i, path in enumerate(sorted(detail_urls), 1):
    slug = path.rsplit("/", 1)[-1].removesuffix(".html")
    try:
        html = get(BASE + path)
    except Exception as e:
        print(f"  [{i}] {slug}: {e}")
        continue
    pages[slug] = set(IMG.findall(html))
    time.sleep(0.25)  # be polite to their server
    if i % 10 == 0:
        print(f"  fetched {i}/{len(detail_urls)}")

# 3. Site furniture = any image appearing on most pages.
counts = Counter()
for imgs in pages.values():
    counts.update(imgs)
threshold = max(2, len(pages) * 0.4)
furniture = {u for u, n in counts.items() if n >= threshold}
print(f"\nShared site furniture: {len(furniture)} images (on >= {threshold:.0f} pages)")

# 4. What remains per page is that product's own photography.
result = {}
empty = []
for slug, imgs in pages.items():
    unique = sorted(imgs - furniture)
    if unique:
        result[slug] = unique[:4]
    else:
        empty.append(slug)

OUT.write_text(json.dumps(result, indent=2), encoding="utf-8")
print(f"\n{len(result)} products with own imagery -> {OUT.name}")
print(f"{len(empty)} products with none: {', '.join(empty[:8])}")
counts_per = Counter(len(v) for v in result.values())
print("images per product:", dict(sorted(counts_per.items())))
