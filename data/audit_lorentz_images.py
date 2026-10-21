"""Reverts the LORENTZ attributions that do not actually depict the product.

apply_lorentz_images.py mapped by product family, which was too loose. Where
the family shot was a 150px brochure thumbnail it got skipped, and the product
silently fell through to the next image in the rule — a system-layout DIAGRAM
or a field installation photo. A wiring schematic sitting where the product
photo belongs looks worse than an honest gap, and a photo of a solar array on
a 'PSk2-9 Mainboard' listing is simply the wrong product.

The rule applied here: an image may stay only if it DEPICTS the product or its
immediate family. Diagrams, lifestyle shots, brochure covers and photographs of
a different product are removed and the SKU goes back to unpublished.

LORENTZ publishes clean product photography only in its partner portal, so
these SKUs need imagery from the client's LORENTZ account.
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent

# Filenames that are NOT product photography, by the stem written into
# public/products. Keyed on the source filename recorded in provenance.
NOT_PRODUCT_PHOTOGRAPHY = {
    # Wiring / system schematics.
    "lorentz-ps2_systemLayout.png",
    "PSk3_SystemLayout_irrigation_forDrawAttentionWebsite_smaller.png",
    # Field installation and marketing shots, not product shots.
    "lorentz-psk2-large-system-solar-panels.jpg",
    "lorentz-installing-a-large-system.jpg",
    "lorentz-pv-modules-installation.jpg",
    "lorentz-pv-modules-happy-customers.jpg",
    # Brochure covers.
    "lorentz_ps2_product-brochure_en_Page_01.jpg",
    "PP2000S-cover-pNET-1500x1500.png",
    "PP2000S-cover-pNET.png",
    # A SmartStart box is a different product from a surge protector or
    # Powerpack; using it for those was a mis-attribution.
    "SmartStart-Small-Blue-Box_white-square.png",
}

products = json.loads((ROOT / "products.json").read_text(encoding="utf-8"))
provenance = json.loads((ROOT / "image-provenance.json").read_text(encoding="utf-8"))

source_of = {e["file"]: e["source_url"].rsplit("/", 1)[-1] for e in provenance}

removed_files = set()
unpublished = []
kept = []

for p in products:
    if p["brand"] != "Lorentz" or not p["images"]:
        continue
    good = []
    for img in p["images"]:
        name = source_of.get(img["url"])
        if name in NOT_PRODUCT_PHOTOGRAPHY:
            removed_files.add(img["url"])
        else:
            good.append(img)

    # Renumber so the kept images stay contiguous and the primary is first.
    for i, img in enumerate(good):
        img["type"] = "primary" if i == 0 else "angle"

    p["images"] = good
    if good:
        kept.append((p["slug"], len(good)))
    else:
        p["is_published"] = False
        unpublished.append(p["slug"])

# Drop the now-unreferenced files and their provenance entries.
referenced = {img["url"] for p in products for img in p["images"]}
PUB = ROOT.parent / "public"
deleted = 0
for rel in sorted(removed_files - referenced):
    for path in (PUB / rel.lstrip("/"), PUB / rel.lstrip("/").replace(".webp", "-thumb.webp")):
        if path.exists():
            path.unlink()
            deleted += 1
    parent = (PUB / rel.lstrip("/")).parent
    if parent.exists() and not any(parent.iterdir()):
        parent.rmdir()

provenance = [e for e in provenance if e["file"] in referenced]

(ROOT / "products.json").write_text(
    json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8"
)
(ROOT / "image-provenance.json").write_text(
    json.dumps(provenance, indent=2, ensure_ascii=False), encoding="utf-8"
)

print(f"Lorentz SKUs keeping genuine product photography: {len(kept)}")
for slug, n in kept:
    print(f"    {slug}  ({n})")
print(f"\nReverted to unpublished (no genuine photograph): {len(unpublished)}")
print(f"Image files deleted: {deleted}")

pub = [p for p in products if p["is_published"]]
print(f"\nPublished total: {len(pub)}")
print(f"  without imagery: {len([p for p in pub if not p['images']])}  (must be 0)")
