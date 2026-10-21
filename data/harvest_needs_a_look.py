"""Photographs the rows the back office flags as "needs a look" for imagery.

Twenty-five products were live-but-unbuyable or missing a photograph. Every one
of them is hardware somebody else manufactures, and most of those manufacturers
publish per-model photography if you go to the right site.

Where it comes from, and why the source can be trusted:

  Solargen   solargentechnologies.com is the supplier's own WooCommerce store.
             They photograph the ZJ Beny breakers per amperage, and the rating
             is legible on the label in every shot — which is also why the
             ratings they do not stock are skipped rather than substituted.
  ZJ Beny    zjbenysolar.com is the manufacturer. Their 2-pole BB1-63 shot
             carries a "B63" label, so it is the 63A part Solargen do not show.
  Growatt    en.growatt.com serves one studio shot per off-grid family from the
             product page HTML at /upload/image/.
  Lithium    lithiumvalley.com publish no gallery for the LV-MAST-T12K-A, but
  Valley     their own datasheet PDF embeds two clean renders of the unit.
  Horay      horaysolar.com publishes one photograph per N-Type series, not per
             wattage. Each SKU takes the series whose published band contains
             its wattage, or the nearest band within 25 W — see HORAY below.

Fourteen of the twenty-five are deliberately left alone; see SKIPPED at the
bottom for the reason on each. A wrong photograph is worse than an honest gap.

    python data/harvest_needs_a_look.py            # download + report
    python data/harvest_needs_a_look.py --write    # also write webp + json
    node scripts/apply-needs-a-look-imagery.mjs --apply   # then push to Supabase

Slugs, names and categories are read from data/products.json, which is where
these rows live (unlike the Chloride Exide import, which is Supabase-only).
"""
import hashlib
import io
import json
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).parent
PUB = ROOT.parent / "public" / "products"
CACHE = ROOT / ".needs-a-look-image-cache"
TODAY = date.today().isoformat()
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

SOLARGEN = "https://solargentechnologies.com/wp-content/uploads/2020/06/"
BENY = "https://www.zjbenysolar.com/zyupload/201811/22/"
GROWATT = "https://en.growatt.com/upload/image/"
HORAY = "https://www.horaysolar.com/static/upload/image/20231117/"
LV_DATASHEET = ("https://lithiumvalley.com/wp-content/uploads/2026/07/"
                "LV-MAST-T12K-A-V1.0-Datasheet.pdf")

SOLARGEN_SRC = "solargentechnologies.com (Solargen Technologies' own store photography)"
BENY_SRC = "zjbenysolar.com (official ZJ Beny product page)"
GROWATT_SRC = "growatt.com (official Growatt product page)"
HORAY_SRC = "horaysolar.com (official Horay Solar series photograph)"
LV_SRC = "lithiumvalley.com (unit render in Lithium Valley's own datasheet)"

# Horay publish one photograph per N-Type series, keyed by the wattage band the
# series covers. A module's cell layout is what the picture actually shows, so
# each SKU takes the series whose band contains its wattage; where no band does,
# the nearest band within 25 W, which is inside the tolerance of one cell row.
# 350W is 80 W below anything Horay publish as N-Type and is skipped.
# The band each series covers is in the comment rather than the alt text: a
# screen reader reading "460W ... 430~450W" out loud is just confusing.
HORAY_SERIES = {
    "ocean-108": (HORAY + "1700229292762143.png", "HS182-108TC-D-Ocean"),    # 430~450W
    "ocean-120": (HORAY + "1700229274133706.png", "HS182-120TC-D-Ocean"),    # 480~500W
    "ocean-132": (HORAY + "1700229253589526.png", "HS182-132TC-D-Ocean"),    # 530~550W
    "ocean-144": (HORAY + "1700229231607386.png", "HS182-144TC-D-Ocean"),    # 585~605W
    "galaxy-120": (HORAY + "1700229253589526-2.png", "HS210-120TC-D-Galaxy"),  # 635W
}
HORAY_ASSIGNMENT = {
    420: "ocean-108", 440: "ocean-108", 450: "ocean-108", 460: "ocean-108",
    490: "ocean-120", 500: "ocean-120",
    520: "ocean-132", 560: "ocean-132",
    590: "ocean-144",
    630: "galaxy-120",
}

# slug -> (source label, [(url, view)])
# view becomes the alt text suffix; the first entry is the primary image.
PLAN = {
    # ---------- Solargen's own store photography of the ZJ Beny breakers ----------
    "solargen-zb-dc-16a": (SOLARGEN_SRC, [
        (SOLARGEN + "2-Pole-PV-DC-Breaker-16A.jpg", "front view"),
    ]),
    "solargen-zb-dc-80a": (SOLARGEN_SRC, [
        (SOLARGEN + "2-Pole-PVDC-Breaker-80A.jpg", "front view"),
    ]),
    "solargen-zb-dc-125a": (SOLARGEN_SRC, [
        (SOLARGEN + "2-Pole-PVDC-Breaker-125A.jpg", "front view"),
    ]),
    "solargen-zb-dc-250a": (SOLARGEN_SRC, [
        (SOLARGEN + "2-Pole-PVDC-Breaker-250A.jpg", "front view"),
    ]),

    # ---------- ZJ Beny ----------
    # Solargen photograph the BB1-63 only at 16A and 32A. ZJ Beny's own 2-pole
    # shot is labelled "B63", so it is this product rather than a near neighbour.
    "solargen-zb-dc-63a": (BENY_SRC, [
        (BENY + "BB1-2P-201811222212129054.jpg", "front view"),
    ]),

    # ---------- Growatt ----------
    "growatt-spf-6000-es-plus": (GROWATT_SRC, [
        (GROWATT + "20221208/fa70b02c9448acc893e057afc225d606.png", "front view"),
    ]),
    # Growatt publish the 3.5kW ES Lite inside the SPF 3000-5000 ES/ES LITE
    # family page; the chassis is common to every rating in it.
    "growatt-spf-3500-es-lite": (GROWATT_SRC, [
        (GROWATT + "20220823/8cb261a2a2505b1c21e019ff6f86cf2f.png",
         "SPF 3000-5000 ES/ES LITE series photograph"),
    ]),
    # Growatt list no "SPF 12000 ES" — their ES line stops at 6kW. The only
    # Growatt 48V 12kVA single-phase off-grid unit is the SPF 12000T DVM, whose
    # family page this is. The row's model name needs confirming with Lekkerix;
    # it has no retail price, so it stays unpublished either way.
    "growatt-spf-12000-es": (GROWATT_SRC, [
        (GROWATT + "71ba4d46bd47a93a57f7733cd61988e7.png",
         "SPF 4000-18000T DVM series photograph"),
    ]),

    # ---------- Lithium Valley ----------
    # Catalogued under the Deye brand, but LV-MAST-T12K-A is Lithium Valley's
    # own model code and Lekkerix supply both. Renders come out of their
    # datasheet because the product page is JavaScript-rendered.
    "deye-lv-mast-t12k-a": (LV_SRC, [
        (LV_DATASHEET + "#2", "angled view"),
        (LV_DATASHEET + "#9", "front view"),
    ]),
}

for watts, series in HORAY_ASSIGNMENT.items():
    url, label = HORAY_SERIES[series]
    PLAN[f"horay-horay-n-{watts}"] = (HORAY_SRC, [(url, f"{label} series photograph")])

SKIPPED = {
    "solargen-zb-dc-200a":
        "Solargen photograph the BDM range at 80A, 125A and 250A only, and the "
        "rating is printed on every label. ZJ Beny publish BDM-125 and BDM-250 "
        "but no BDM-200, so there is no 200A photograph to use.",
    "solargen-bb-3w":
        "Solargen's store carries no breaker box; their product sitemap lists "
        "only the two ZJ Beny breaker lines under balance-of-system.",
    "solargen-bb-6w": "As above — no breaker box on Solargen's store.",
    "solargen-bb-13w": "As above — no breaker box on Solargen's store.",
    "solargen-db18-250":
        "As above. Solargen publish no distribution board of any way count.",
    "lithium-valley-w15-footpad":
        "Lithium Valley photograph the W15-5A battery, not its accessories. The "
        "foot pad appears in no shot on their site or in the datasheet.",
    "lithium-valley-w15-wheels":
        "As above — the datasheet cover shows the wheels fitted to the battery, "
        "which is a photograph of the battery, not of the wheels kit.",
    "hexing-hxdb20r01002":
        "HXDB20R is a Hexing/Livoltek product code, but neither hexing nor "
        "Livoltek publish a photograph for it. The only AC combiner asset on "
        "Livoltek's regional shops is a specification table, not a product shot.",
    "horay-horay-n-350":
        "Horay's published N-Type range starts at 430W. 350W sits 80 W below "
        "anything they photograph, so no series shot honestly depicts it.",
}


def fetch(url):
    """Downloads url once and keeps it, so a rerun costs nobody a request."""
    CACHE.mkdir(exist_ok=True)
    key = CACHE / hashlib.sha1(url.encode()).hexdigest()[:16]
    if key.exists():
        return key.read_bytes()
    host = urllib.parse.urlparse(url).netloc
    req = urllib.request.Request(url.split("#")[0], headers={
        "User-Agent": UA, "Referer": f"https://{host}/"})
    raw = urllib.request.urlopen(req, timeout=60).read()
    key.write_bytes(raw)
    return raw


def load(url):
    """Returns a PIL image, pulling it out of a datasheet when url ends '.pdf#n'."""
    raw = fetch(url)
    if ".pdf" in url:
        import fitz  # only needed for the Lithium Valley datasheet
        index = int(url.rsplit("#", 1)[1])
        doc = fitz.open(stream=raw, filetype="pdf")
        xref = doc[0].get_images(full=True)[index][0]
        pix = fitz.Pixmap(doc, xref)
        if pix.n - pix.alpha > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        return Image.open(io.BytesIO(pix.tobytes("png")))
    return Image.open(io.BytesIO(raw))


def flatten(img):
    """Puts transparent shots on white so the webp matches the rest of the set."""
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA")
    if img.mode == "RGBA":
        canvas = Image.new("RGB", img.size, (255, 255, 255))
        canvas.paste(img, mask=img.split()[3])
        return canvas
    return img


def main():
    write = "--write" in sys.argv
    products = json.loads((ROOT / "products.json").read_text(encoding="utf-8"))
    targets = {p["slug"]: p for p in products}

    missing = [s for s in list(PLAN) + list(SKIPPED) if s not in targets]
    if missing:
        raise SystemExit(f"not in products.json: {', '.join(missing)}")

    provenance = json.loads((ROOT / "image-provenance.json").read_text(encoding="utf-8"))
    known = {e["file"] for e in provenance}
    patch = {}

    for slug, (source, entries) in PLAN.items():
        target = targets[slug]
        dest = PUB / target["category"] / slug
        images = []
        for i, (url, view) in enumerate(entries, 1):
            try:
                img = flatten(load(url))
            except Exception as exc:
                print(f"  {slug} {i:02d}: FAILED {exc}")
                continue
            rel = f"/products/{target['category']}/{slug}/{i:02d}.webp"
            if write:
                dest.mkdir(parents=True, exist_ok=True)
                main_img = img.copy()
                main_img.thumbnail((1600, 1600), Image.LANCZOS)
                main_img.save(dest / f"{i:02d}.webp", "WEBP", quality=88)
                thumb = img.copy()
                thumb.thumbnail((400, 400), Image.LANCZOS)
                thumb.save(dest / f"{i:02d}-thumb.webp", "WEBP", quality=82)
            images.append({
                "url": rel,
                "alt": f"{target['name']} — {view}",
                "type": "primary" if i == 1 else "angle",
            })
            if rel not in known:
                provenance.append({"file": rel, "source_url": url,
                                   "source": source, "retrieved": TODAY})
                known.add(rel)
        patch[slug] = images
        print(f"  {slug}: {len(images)} image(s)  [{img.size[0]}x{img.size[1]}]")

    if write:
        # products.json is the source the sync script reads, so the imagery goes
        # in here too. Publishing still needs a price, which these rows decide
        # for themselves — this only ever adds photographs.
        for p in products:
            if patch.get(p["slug"]):
                p["images"] = patch[p["slug"]]
        (ROOT / "products.json").write_text(
            json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8")
        (ROOT / "image-provenance.json").write_text(
            json.dumps(provenance, indent=2, ensure_ascii=False), encoding="utf-8")
    (ROOT / "needs-a-look-image-patch.json").write_text(
        json.dumps(patch, indent=1, ensure_ascii=False), encoding="utf-8")

    total = sum(len(v) for v in patch.values())
    print(f"\n{total} images for {len(patch)} products"
          f"{'' if write else ' (dry run — pass --write)'}")
    print(f"{len(SKIPPED)} products left without a photograph on purpose")


if __name__ == "__main__":
    main()
