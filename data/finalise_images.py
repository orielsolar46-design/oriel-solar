"""Guarantees that every PUBLISHED product carries real photography.

Two passes:

1. Family extension — a product with no imagery inherits the photography of
   another product in the same brand AND model family (e.g. all Solis
   S6-EH1P LV inverters share the series shot). Only same-series matches are
   used; a battery never inherits an inverter's photo.

2. Unpublish the remainder — anything still without imagery is set
   is_published = false. It stays in the catalogue for the admin, and can be
   published the moment a photograph exists. This is deliberate: a storefront
   showing "photograph coming soon" on a KES 100 earthing clip reads worse
   than not listing the clip at all.

The placeholder therefore never appears on the public site.
"""
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).parent
products = json.loads((ROOT / "products.json").read_text(encoding="utf-8"))

by_slug = {p["slug"]: p for p in products}
imaged = [p for p in products if p["images"]]


def family_key(p):
    """Brand + model-series prefix. 'S6-EH1P8K-L' -> ('solis', 's6-eh1p')."""
    code = (p["model_code"] or p["slug"]).upper()
    # Trim the size/rating portion so siblings in a series collide.
    stem = re.split(r"\d{1,3}(?:\.\d+)?K|\d{2,}", code)[0].strip("-_ ")
    return (p["brand"].lower(), p["category"], stem.lower())


families = defaultdict(list)
for p in imaged:
    families[family_key(p)].append(p)

extended = 0
for p in products:
    if p["images"] or not p["is_published"]:
        continue
    siblings = families.get(family_key(p))
    if not siblings:
        continue
    donor = siblings[0]
    p["images"] = [
        {
            "url": img["url"],
            # Alt text names THIS product but is honest that the photograph is
            # of the series rather than the exact variant.
            "alt": f"{p['name']} — {donor['brand']} series photograph",
            "type": img["type"],
        }
        for img in donor["images"]
    ]
    extended += 1

print(f"Pass 1 — inherited series photography: {extended} products")

unpublished = []
for p in products:
    if p["is_published"] and not p["images"]:
        p["is_published"] = False
        unpublished.append(p)

print(f"Pass 2 — unpublished for lack of photography: {len(unpublished)}")

from collections import Counter
for (brand, cat), n in Counter((p["brand"], p["category"]) for p in unpublished).most_common(10):
    print(f"    {n:3d}  {brand} / {cat}")

(ROOT / "products.json").write_text(
    json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8"
)

pub = [p for p in products if p["is_published"]]
multi = [p for p in pub if len(p["images"]) >= 2]
print(f"\nPublished now: {len(pub)}")
print(f"  with imagery:    {len([p for p in pub if p['images']])}  (must equal published)")
print(f"  with 2+ images:  {len(multi)}")
print(f"  with 4 images:   {len([p for p in pub if len(p['images']) >= 4])}")
