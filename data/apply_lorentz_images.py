"""Maps harvested LORENTZ photography onto the Lorentz SKUs and downloads it.

Mapping is by product TYPE, because that is the level at which LORENTZ
publishes photography: one shot for the centrifugal submersible pump family,
one for helical rotor, one for surface pumps, and individual shots for the
accessories. A 'pump end C-SJ8-15' has no photograph of its own anywhere, and
inventing one would be worse than showing the family shot the manufacturer
itself uses to represent that range.

Alt text says which it is, so nothing on the page claims to be a photograph of
the exact part number when it is a range shot.

Rules name images by FILENAME and the real URL is resolved from
maker-images.json, so the upload paths are never guessed at.
"""
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

harvest = json.loads((ROOT / "maker-images.json").read_text(encoding="utf-8"))
BY_NAME = {}
for page_urls in harvest.get("Lorentz", {}).values():
    for url in page_urls:
        BY_NAME[url.rsplit("/", 1)[-1]] = url

# Rules are tried in order; the first whose matcher accepts the model code wins.
# (matcher, [image filenames], description used in alt text)
RULES = [
    # --- Accessories with their own photograph ---
    (lambda m: m.startswith("WELLPROBE"),
     ["Well-Probe_Installation_10_6_cut_square.png"],
     "product photograph"),
    (lambda m: m == "WATERSENSOR",
     ["lorentz-float-switch.jpg"],
     "product photograph"),
    (lambda m: m.startswith("LPS-"),
     ["19-004395_LLS-1000-140_white-square-1.png"],
     "sensor range photograph"),
    (lambda m: m.startswith("PS-COMM") or m.startswith("ANT-"),
     ["PP2000S-cover-pNET-1500x1500.png", "PumpScanner_general_en_200916_website.jpg"],
     "connected range photograph"),
    (lambda m: m.startswith("MNSPD") or m.startswith("PWRPK"),
     ["SmartStart-Small-Blue-Box_white-square.png"],
     "accessory range photograph"),
    (lambda m: m.startswith("LC20"),
     ["lorentz-pv-modules-lc300-p72.jpg", "lorentz-pv-modules.jpg",
      "lorentz-pv-modules-installation.jpg"],
     "PV module range photograph"),

    # --- Controllers / drives ---
    (lambda m: m.startswith("PSK"),
     ["lorentz-psk2-large-system-solar-panels.jpg",
      "PSk3_SystemLayout_irrigation_forDrawAttentionWebsite_smaller.png",
      "lorentz-installing-a-large-system.jpg"],
     "PSk system range photograph"),
    (lambda m: m.startswith("PS2-") or m.startswith("ACD-") or m.startswith("ECD-"),
     ["lorentz_ps2_product-brochure_en_Page_01.jpg", "lorentz-ps2_systemLayout.png"],
     "PS2 system range photograph"),

    # --- Pumps: helical rotor before the general centrifugal catch-all ---
    (lambda m: "-HR" in m,
     ["lorentz_ps_hr_general_en-en.jpg"],
     "helical rotor pump range photograph"),
    (lambda m: m.startswith("PE-") or m.startswith("PU"),
     ["lorentz_ps_c_general_en-en.jpg", "lorentz_ps_surface_general_en-en.jpg",
      "lorentz-ps2_systemLayout.png"],
     "centrifugal submersible pump range photograph"),
]

missing = {n for _, names, _ in RULES for n in names if n not in BY_NAME}
if missing:
    print("Not present in the harvest, these rules will yield fewer images:")
    for n in sorted(missing):
        print(f"  {n}")
    print()

products = json.loads((ROOT / "products.json").read_text(encoding="utf-8"))
provenance = json.loads((ROOT / "image-provenance.json").read_text(encoding="utf-8"))
seen = {e["file"] for e in provenance}

cache: dict[str, bytes | None] = {}


def fetch(url: str):
    if url not in cache:
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": UA, "Referer": "https://www.lorentz.de/"}
            )
            cache[url] = urllib.request.urlopen(req, timeout=45).read()
        except Exception as e:
            print(f"    fetch failed {url.rsplit('/', 1)[-1]}: {e}")
            cache[url] = None
    return cache[url]


done = skipped = 0

for p in products:
    if p["brand"] != "Lorentz" or p["images"]:
        continue
    model = (p["model_code"] or "").upper()
    rule = next((r for r in RULES if r[0](model)), None)
    if rule is None:
        skipped += 1
        continue
    _, names, kind = rule

    dest = PUB / p["category"] / p["slug"]
    entries = []
    for name in names:
        url = BY_NAME.get(name)
        if url is None:
            continue
        raw = fetch(url)
        if raw is None:
            continue
        try:
            img = Image.open(BytesIO(raw))
        except Exception as e:
            print(f"    decode failed {name}: {e}")
            continue
        if max(img.size) < 300:
            continue
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA")

        i = len(entries) + 1
        dest.mkdir(parents=True, exist_ok=True)
        main = img.copy()
        main.thumbnail((1600, 1600), Image.LANCZOS)
        main.save(dest / f"{i:02d}.webp", "WEBP", quality=88)
        thumb = img.copy()
        thumb.thumbnail((400, 400), Image.LANCZOS)
        thumb.save(dest / f"{i:02d}-thumb.webp", "WEBP", quality=82)

        rel = f"/products/{p['category']}/{p['slug']}/{i:02d}.webp"
        entries.append({
            "url": rel,
            "alt": f"{p['name']} — LORENTZ {kind}",
            "type": "primary" if i == 1 else "angle",
        })
        if rel not in seen:
            provenance.append({
                "file": rel,
                "source_url": url,
                "source": "lorentz.de (official LORENTZ site)",
                "retrieved": TODAY,
            })
            seen.add(rel)

    if entries:
        p["images"] = entries
        p["is_published"] = True
        done += 1
        print(f"  {p['slug']}: {len(entries)} images ({kind})")

(ROOT / "products.json").write_text(
    json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8"
)
(ROOT / "image-provenance.json").write_text(
    json.dumps(provenance, indent=2, ensure_ascii=False), encoding="utf-8"
)

print(f"\nLorentz products given photography: {done}")
print(f"No matching rule (left unpublished): {skipped}")
