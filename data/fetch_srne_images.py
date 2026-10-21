"""Downloads the SRNE imagery recorded by add_srne.py into public/products/
and writes the image entries onto each product."""
import json
import urllib.request
from datetime import date
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).parent
PUB = ROOT.parent / "public" / "products"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36"
TODAY = date.today().isoformat()

products = json.loads((ROOT / "products.json").read_text(encoding="utf-8"))
provenance = json.loads((ROOT / "image-provenance.json").read_text(encoding="utf-8"))
seen = {e["file"] for e in provenance}

VIEWS = ["front view", "angled view", "detail view", "installation view"]
saved = 0

for p in products:
    urls = p.pop("_srne_urls", None)
    page = p.pop("_srne_page", None)
    if not urls:
        continue

    dest = PUB / p["category"] / p["slug"]
    dest.mkdir(parents=True, exist_ok=True)
    entries = []

    for i, url in enumerate(urls[:4], 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            raw = urllib.request.urlopen(req, timeout=45).read()
            img = Image.open(BytesIO(raw))
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGBA")
            # Skip anything too small to be a real product shot.
            if max(img.size) < 200:
                continue
            main = img.copy()
            main.thumbnail((1600, 1600), Image.LANCZOS)
            main.save(dest / f"{i:02d}.webp", "WEBP", quality=88)
            thumb = img.copy()
            thumb.thumbnail((400, 400), Image.LANCZOS)
            thumb.save(dest / f"{i:02d}-thumb.webp", "WEBP", quality=82)

            rel = f"/products/{p['category']}/{p['slug']}/{i:02d}.webp"
            entries.append({
                "url": rel,
                "alt": f"{p['name']} — {VIEWS[min(i - 1, len(VIEWS) - 1)]}",
                "type": "primary" if i == 1 else "angle",
            })
            if rel not in seen:
                provenance.append({
                    "file": rel,
                    "source_url": url,
                    "source": f"srnesolar.com (official SRNE site, {page})",
                    "retrieved": TODAY,
                })
                seen.add(rel)
            saved += 1
        except Exception as e:
            print(f"  {p['slug']} image {i}: {e}")

    p["images"] = entries
    print(f"  {p['slug']}: {len(entries)} images")

(ROOT / "products.json").write_text(
    json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8"
)
(ROOT / "image-provenance.json").write_text(
    json.dumps(provenance, indent=2, ensure_ascii=False), encoding="utf-8"
)
print(f"\n{saved} SRNE image files written")
