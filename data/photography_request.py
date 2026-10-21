"""Writes PHOTOGRAPHY-NEEDED.md — the list Oriel sends to each supplier.

Every product here is in the catalogue with correct pricing and specifications
and is one photograph away from going live. Grouped by supplier so the list can
be forwarded as-is.
"""
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).parent
products = json.loads((ROOT / "products.json").read_text(encoding="utf-8"))

missing = [p for p in products if not p["is_published"] and not p["images"]]
by_brand = defaultdict(list)
for p in missing:
    by_brand[p["brand"]].append(p)

pub = [p for p in products if p["is_published"]]

lines = [
    "# Photography needed",
    "",
    f"**{len(missing)} of {len(products)} products** are complete except for a photograph, ",
    "so they are held back from the storefront rather than shown with a ",
    '"photograph coming soon" placeholder.',
    "",
    f"Live now: **{len(pub)}** products, every one with real photography.",
    "",
    "## What is needed",
    "",
    "One photograph per product is enough to publish it. Three or four views ",
    "(front, angled, detail, installed) is what the SRNE range has and it is ",
    "noticeably more convincing on the product page.",
    "",
    "Acceptable sources, in order of preference:",
    "",
    "1. The supplier's own product photography, with written permission to use it.",
    "2. Photographs taken at the Oriel warehouse — a plain wall and daylight is fine.",
    "3. The manufacturer's dealer/partner portal, which most of these brands operate.",
    "",
    "## Why these could not be sourced automatically",
    "",
    "| Brand | Products | Reason |",
    "| --- | --- | --- |",
]

REASONS = {
    "Lorentz": "Public site carries only marketing and schematic imagery; product photography is behind the LORENTZ partner portal",
    "Hanti": "No public product photography found",
    "Lithium Valley": "Their CDN returns 404 to direct asset requests",
    "Solargen": "Local distributor; no public product photography",
    "Hexing": "No public product photography found",
    "Horay": "No public product photography found",
    "Maqbul": "No public product photography found",
    "Victron Energy": "Product pages render images via JavaScript; the charge-controller shots could not be read from the HTML",
    "Jinko Solar": "No per-model photography located",
    "Livoltek": "No per-model photography located",
    "Lekkerix": "Local distributor; no public product photography",
    "Shiyuan": "No public product photography found",
    "Growatt": "Site did not respond",
    "Deye": "No per-model photography located",
    "TW Solar": "No per-model photography located",
}

for brand, items in sorted(by_brand.items(), key=lambda kv: -len(kv[1])):
    reason = REASONS.get(brand, "No public product photography found")
    lines.append(f"| {brand} | {len(items)} | {reason} |")

lines += ["", "## Full list by supplier", ""]

for brand, items in sorted(by_brand.items(), key=lambda kv: -len(kv[1])):
    lines.append(f"### {brand} ({len(items)})")
    lines.append("")
    lines.append("| Model | Product | Category |")
    lines.append("| --- | --- | --- |")
    for p in sorted(items, key=lambda x: (x["category"], x["name"])):
        lines.append(f"| {p['model_code'] or '—'} | {p['name']} | {p['category']} |")
    lines.append("")

(ROOT.parent / "PHOTOGRAPHY-NEEDED.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

print(f"PHOTOGRAPHY-NEEDED.md — {len(missing)} products across {len(by_brand)} suppliers")
for brand, items in sorted(by_brand.items(), key=lambda kv: -len(kv[1])):
    print(f"  {len(items):3d}  {brand}")
