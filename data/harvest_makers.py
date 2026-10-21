"""Harvests product photography from manufacturer sites for the brands left
without imagery after the SRNE pass.

Same technique as harvest_srne.py: fetch every candidate page for a brand,
treat any image appearing on most pages as site furniture, and keep the
difference. Writes data/maker-images.json as { brand: { page_slug: [urls] } }
so the mapping stays auditable before anything is downloaded.

Series photography is expected and acceptable here. A LORENTZ "pump end
C-SJ5-4" is a component of a PS2 system and the manufacturer publishes one
photograph for the series, not per part number; the alt text written later
says so rather than implying it is a shot of that exact part.
"""
import json
import re
import time
import urllib.request
from collections import Counter
from pathlib import Path

OUT = Path(__file__).parent / "maker-images.json"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

# brand -> (list of page URLs to fetch, regex matching that site's asset URLs)
SITES = {
    "Lorentz": (
        [
            "https://www.lorentz.de/products-and-technology/products/ps2-solar-pumping-systems/",
            "https://www.lorentz.de/products-and-technology/products/psk-solar-pumping-systems/",
            "https://www.lorentz.de/products-and-technology/products/solar-pump-accessories/",
            "https://www.lorentz.de/products-and-technology/products/smarttap-water-dispensing/",
            "https://www.lorentz.de/products-and-technology/products/pv-modules/",
            "https://www.lorentz.de/products-and-technology/products/connected/",
        ],
        r"https://www\.lorentz\.de/wp-content/uploads/[^\"'\s<>]+?\.(?:jpg|jpeg|png|webp)",
    ),
    "Victron Energy": (
        [
            "https://www.victronenergy.com/inverters",
            "https://www.victronenergy.com/inverters-chargers",
            "https://www.victronenergy.com/solar-charge-controllers",
        ],
        r"https://www\.victronenergy\.com/(?:upload|static)/[^\"'\s<>]+?\.(?:jpg|jpeg|png|webp)",
    ),
}

# Relative-URL sites need the host prefixed back on.
RELATIVE = re.compile(r"(?:src|data-src|data-lazy-src)=\"(/wp-content/uploads/[^\"]+?\.(?:jpg|jpeg|png|webp))\"", re.I)


def get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode("utf-8", errors="ignore")


def strip_size(url: str) -> str:
    """WordPress serves the same photo at many sizes ('-350x350.jpg').
    Collapse to the original so furniture detection is not fooled by a
    resize, and so we download the largest version available."""
    return re.sub(r"-\d{2,4}x\d{2,4}(?=\.(?:jpg|jpeg|png|webp)$)", "", url, flags=re.I)


result = {}

for brand, (urls, pattern) in SITES.items():
    asset = re.compile(pattern, re.I)
    host = re.match(r"https://[^/]+", urls[0]).group(0)
    pages = {}

    for url in urls:
        slug = url.rstrip("/").rsplit("/", 1)[-1]
        try:
            html = get(url)
        except Exception as e:
            print(f"  {brand}/{slug}: {e}")
            continue
        found = set(asset.findall(html))
        found |= {host + m for m in RELATIVE.findall(html)}
        pages[slug] = {strip_size(u) for u in found}
        print(f"  {brand}/{slug}: {len(pages[slug])} images")
        time.sleep(0.3)

    if not pages:
        continue

    counts = Counter()
    for imgs in pages.values():
        counts.update(imgs)
    # With only a handful of pages per brand, "on most pages" is the right
    # furniture test; a genuine product shot appears on exactly one.
    threshold = max(2, len(pages) * 0.5)
    furniture = {u for u, n in counts.items() if n >= threshold}

    brand_result = {}
    for slug, imgs in pages.items():
        unique = sorted(imgs - furniture)
        if unique:
            brand_result[slug] = unique[:6]
    result[brand] = brand_result
    print(f"  -> {brand}: {len(furniture)} furniture, "
          f"{sum(len(v) for v in brand_result.values())} product images "
          f"across {len(brand_result)} pages\n")

OUT.write_text(json.dumps(result, indent=2), encoding="utf-8")
print(f"Written to {OUT.name}")
