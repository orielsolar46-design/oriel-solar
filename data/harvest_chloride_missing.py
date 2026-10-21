"""Photographs the 46 Chloride Exide rows that were imported without imagery.

Chloride's own store carries only 34 of the 80 lines on their July 2026
pricelist, so the rest were left unpublished. Most of them are not Chloride's
own hardware at all — they are Victron, Deye, WECO, TBB and Jinko products
Chloride distributes — and those manufacturers publish per-model photography.

Where it comes from, and why the source can be trusted:

  Victron    victronenergy.com serves 300 dpi studio shots straight from the
             product page HTML at /upload/documents/, named by model
             ("Quattro 48V 10000VA 140A 230V (front).png"). An earlier pass
             recorded these pages as JavaScript-rendered; they are not.
  Deye       deye.com is WordPress; the product page for each model links its
             own /wp-content/uploads/ photograph.
  WECO       wecobatteries.com has a page per module (16K0 LV, 16K0 HV).
  TBB        tbbrenewable.com serves product shots through /getFile/.
  Jinko      Module photographs are embedded in the datasheet PDF for each
             series, which is the only place Jinko publishes them per model.
  Chloride   Their Wix store's own photography, via the sitemap (see
             the note in the git history about the sitemap sidestepping their
             rate limiter).

Fifteen of the 46 are deliberately left alone; see SKIPPED at the bottom for
the reason on each. A wrong photograph is worse than an honest gap.

    python data/harvest_chloride_missing.py            # download + report
    python data/harvest_chloride_missing.py --write    # also write webp files
    node scripts/apply-chloride-imagery.mjs --apply    # then push to Supabase

chloride-missing-imagery.json is the slug/name/category of every Chloride row
that had no imagery, taken from Supabase — these rows live only in the database,
not in products.json. To rebuild it:

    select slug, name, category from products
    where source_supplier ilike '%chloride%' and coalesce(images, '[]') = '[]'
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
CACHE = ROOT / ".chloride-image-cache"
TODAY = date.today().isoformat()
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

VICTRON = "https://www.victronenergy.com/upload/documents/"
DEYE = "https://deye.com/wp-content/uploads/"
WECO = "https://wecobatteries.com/wp-content/uploads/2026/02/"
TBB = "https://www.tbbrenewable.com/getFile/"
JINKO = "https://jinkosolarcdn.shwebspace.com/uploads/"

VICTRON_SRC = "victronenergy.com (official Victron Energy product page)"
DEYE_SRC = "deye.com (official Deye product page)"
WECO_SRC = "wecobatteries.com (official WeCo product page)"
TBB_SRC = "tbbrenewable.com (official TBB Power product page)"
JINKO_SRC = "jinkosolar.com (official JinkoSolar site)"
JINKO_PDF_SRC = "jinkosolar.com (module photograph in JinkoSolar's own datasheet)"
CHLORIDE_SRC = "chlorideexide.com (Chloride Exide's own store photography)"


def wix(media_id):
    ext = media_id.rsplit(".", 1)[-1]
    return (f"https://static.wixstatic.com/media/{media_id}"
            f"/v1/fit/w_1600,h_1600,q_90/file.{ext}")


def tbb(path):
    return TBB + urllib.parse.quote(path, safe="")


# slug -> (source label, [(url, view, pdf_page_image_index or None)])
# view becomes the alt text suffix; the first entry is the primary image.
PLAN = {
    # ---------- Victron Energy ----------
    "chloride-smart-solar-mppt-450-100-mc4": (VICTRON_SRC, [
        (VICTRON + "SmartSolar%20MPPT%20RS%20450-100-MC4%20%28front%29.png", "front view"),
        (VICTRON + "SmartSolar%20MPPT%20RS%20450-100-MC4%20%28left%29.png", "left side"),
        (VICTRON + "SmartSolar%20MPPT%20RS%20450-100-MC4%20%28right%29.png", "right side"),
    ]),
    "chloride-smart-solar-mppt-450-100-tr": (VICTRON_SRC, [
        (VICTRON + "SmartSolar%20MPPT%20RS%20450-100-Tr%20%28front%29.png", "front view"),
        (VICTRON + "SmartSolar%20MPPT%20RS%20450-100-Tr%20%28left%29.png", "left side"),
        (VICTRON + "SmartSolar%20MPPT%20RS%20450-100-Tr%20%28right%29.png", "right side"),
    ]),
    "chloride-smart-solar-mppt-450-200-mc4": (VICTRON_SRC, [
        (VICTRON + "SmartSolar%20MPPT%20RS%20450-200-MC4%20%28front%29.png", "front view"),
        (VICTRON + "SmartSolar%20MPPT%20RS%20450-200-MC4%20%28left%29.png", "left side"),
        (VICTRON + "SmartSolar%20MPPT%20RS%20450-200-MC4%20%28right%29.png", "right side"),
    ]),
    # Victron's (front-angle) file for the 250/100 shows a unit labelled
    # "250|100 - Tr"; only the (top) shot actually reads MC4, so that is the one.
    "chloride-smart-solar-mppt-250-100-mc4": (VICTRON_SRC, [
        (VICTRON + "SmartSolar%20MPPT%20250%20100%20MC4%20VE.Can%20%28top%29.png", "front view"),
    ]),
    "chloride-phoenix-48-500w-inverter": (VICTRON_SRC, [
        (VICTRON + "Inverter%2048V%20500VA%20VE.Direct%20%28top%29.png", "front view"),
    ]),
    "chloride-phoenix-12-1200w-inverter": (VICTRON_SRC, [
        (VICTRON + "Inverter%2012V%201200VA%20VE.Direct%20230V%20%20%28top%29.png", "front view"),
        (VICTRON + "Inverter%2012V%201200VA%20VE.Direct%20230V%20%28side_socket%29.png", "socket end"),
        (VICTRON + "Inverter%2012V%201200VA%20VE.Direct%20230V%20%28front%29.png", "side view"),
    ]),
    "chloride-multiplus-5kva-48v-inverter-charger-victron": (VICTRON_SRC, [
        (VICTRON + "MultiPlus%2048%205000%2070.jpg", "front view"),
    ]),
    "chloride-quattro-48-10000-140-100-100-inverter-charger": (VICTRON_SRC, [
        (VICTRON + "Quattro%2048V%2010000VA%20140A%20230V%20%28front%29.png", "front view"),
        (VICTRON + "Quattro%2048V%2010000VA%20140A%20230V%20%28left%29.png", "left side"),
        (VICTRON + "Quattro%2048V%2010000VA%20140A%20230V%20%28right%29.png", "right side"),
    ]),
    "chloride-quattro-48-15000-inverter-charger": (VICTRON_SRC, [
        (VICTRON + "Quattro%2048V%2015000VA%20200A%20%28front%29.png", "front view"),
        (VICTRON + "Quattro%2048V%2015000VA%20200A%20%28left%29.png", "left side"),
        (VICTRON + "Quattro%2048V%2015000VA%20200A%20%28right%29.png", "right side"),
    ]),

    # ---------- Deye ----------
    "chloride-deye-16kw-48v-single-phase-hybrid-inverter": (DEYE_SRC, [
        (DEYE + "2024/06/sun-12-16k-sg01lp1-1-scaled.png", "front view"),
        (DEYE + "2024/06/sun-12-16k-sg01lp1-6-scaled.png", "angled view"),
    ]),
    "chloride-deye-20kw-lv-48v-3-phase-2-mppt-hybrid-inverter": (DEYE_SRC, [
        (DEYE + "2025/10/sun-14-20k-sg05lp3-eu-sm2-scaled.png", "front view"),
    ]),
    "chloride-deye-50kw-hv-3-phase-multi-mppt-hybrid-inverter": (DEYE_SRC, [
        (DEYE + "2024/06/sun-29.9-50k-sg01hp3-eu-bm3-scaled.png", "front view"),
    ]),
    "chloride-deye-80kw-hv-3-phase-multi-mppt-hybrid-inverter": (DEYE_SRC, [
        (DEYE + "2025/10/sun-60-80k-sg02hp3-eu-em6-1-scaled.png", "front view"),
    ]),
    "chloride-deye-5-12-kw-lv-solar-lithium-battery-se-f5-plus": (DEYE_SRC, [
        (DEYE + "2025/07/%E5%9C%86%E5%B1%8F-2.jpg", "front view"),
        (DEYE + "2025/07/%E5%9C%86%E5%B1%8F%E4%BE%A7%E9%9D%A2.jpg", "side view"),
    ]),
    # Deye photograph the SE-G5.1 as a stack; each unit in it is one 5.12 kWh
    # module, which is what this line sells, so the alt text says so.
    "chloride-deye-5-12-kw-lv-solar-lithium-battery-se-g5-1": (DEYE_SRC, [
        (DEYE + "2025/01/se-g5.1.jpg", "modules shown stacked"),
    ]),

    # ---------- WeCo ----------
    "chloride-solar-16k0-hv-lithium-ion-weco-battery": (WECO_SRC, [
        (WECO + "Weco_ci_frontali_16K0-RACK-HV.png", "front view"),
        (WECO + "Weco_CI_16K0-HV.png", "angled view"),
    ]),
    "chloride-solar-16-06kwh-48v-lv-lithium-ion-weco-battery": (WECO_SRC, [
        (WECO + "Weco_residenziali_frontali_16K0-LV.png", "front view"),
        (WECO + "Weco_Residenziali_16K0-LV-1.png", "angled view"),
    ]),

    # ---------- TBB Power ----------
    "chloride-riio-sun-ii-2kva-24v-solar-inverter-150v-80a-tbb": (TBB_SRC, [
        (tbb("upload/en-product-白底图/2025/07/11/RiiO II (1).webp"), "front view"),
    ]),

    # ---------- JinkoSolar ----------
    # Each wattage takes the photograph of the series whose datasheet range
    # contains it, so the cell count in the picture matches the module sold.
    "jinko-solar-panel-585w": (JINKO_SRC, [
        (JINKO + "665d7237/72-182x182%20V.jpg", "front view"),
    ]),
    "jinko-solar-panel-620w": (JINKO_PDF_SRC, [
        ("https://jinkosolarcdn.shwebspace.com/uploads/JKM605-630N-66HL4M-BDV-F6-EN.pdf#5",
         "front view"),
    ]),
    "jinko-solar-panel-700w": (JINKO_PDF_SRC, [
        ("https://jinkosolarcdn.shwebspace.com/uploads/JKM710-735N-66HL5-BDV-Z6-EN.pdf#5",
         "front view"),
    ]),
    "jinko-solar-panel-720w": (JINKO_PDF_SRC, [
        ("https://jinkosolarcdn.shwebspace.com/uploads/JKM710-735N-66HL5-BDV-Z6-EN.pdf#5",
         "front view"),
    ]),

    # ---------- Chloride Exide's own photography ----------
    "chloride-chloride-solar-lithium-5-1kwh-battery-v2": (CHLORIDE_SRC, [
        (wix("0283bf_efd6da898704423cb7e191301ca2a92b~mv2.jpg"), "front view"),
    ]),
    "chloride-chloride-solar-heat-pump-500l": (CHLORIDE_SRC, [
        (wix("0283bf_b27aca40a5734bcb8a704ac6a2c58387~mv2.png"), "front view"),
    ]),
    "chloride-chloride-solar-heat-pump-80l-vertical": (CHLORIDE_SRC, [
        (wix("0283bf_b27aca40a5734bcb8a704ac6a2c58387~mv2.png"), "front view"),
    ]),
}

# Chloride publish one photograph across their whole panel range, so every
# wattage gets the same picture. The specification table carries the difference.
for watts in (120, 160, 200, 250, 300, 345):
    PLAN[f"chloride-solar-panel-{watts}w"] = (CHLORIDE_SRC, [
        (wix("0283bf_069c063f36c34507aae0c462ae272bb0~mv2.jpg"), "front view"),
    ])

SKIPPED = {
    "chloride-smart-solar-mppt-450-200-tr":
        "Victron publish no Tr photograph for the 450/200; the only 450/200 "
        "shots are of the MC4, and the unit's own front label reads MC4.",
    "chloride-deye-5-12-kw-hv-solar-lithium-battery-bos-g-pro":
        "Deye photograph BOS-G Pro only as a full C&I rack of a dozen modules. "
        "This line sells one 5.12 kWh module.",
    "chloride-deye-5-12-kw-hv-solar-lithium-battery-bos-w":
        "As above — BOS-W is photographed only as a complete rack.",
    "chloride-deye-5-12-kw-lv-solar-lithium-battery-bos-w":
        "As above — BOS-W is photographed only as a complete rack.",
    "chloride-chloride-solar-lithium-10-24-kwh-battery":
        "Not on Chloride's store and not published anywhere else.",
    "chloride-chloride-solar-c-i-lithium-10-24-kwh-cs-xh-battery":
        "Not on Chloride's store; the CS-XH model code returns nothing.",
    "chloride-chloride-solar-125kw-261kwh-c-i-ess-all-in-one":
        "Not on Chloride's store and not published anywhere else.",
    "chloride-chloride-solar-lithium-16-06kwh-battery":
        "Not on Chloride's store and not published anywhere else.",
    "chloride-firstbattery-lithium-5-1kwh-battery":
        "No manufacturer called FirstBattery could be identified.",
    "chloride-chloride-solar-vtt-100l":
        "Chloride's store carries no vacuum-tube heater at all.",
    "chloride-solar-air-conditioner-outdoor-indoor-unit-mount-type":
        "Not on Chloride's store and not published anywhere else.",
    "chloride-swimming-pool-heat-pump-220v-240v":
        "Not on Chloride's store; the domestic heat pump is a different product.",
    "chloride-swimming-pool-heat-pump-380-415v":
        "Not on Chloride's store; the domestic heat pump is a different product.",
    "chloride-solar-200ah-12v-eastman-deep-cycle-lead-carbon":
        "Eastman's own sites do not resolve; Chloride list only the tubular gel, "
        "which is a different chemistry in a differently labelled case.",
    "chloride-solar-230ah-12v-eastman-deep-cycle-lead-carbon":
        "As above.",
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
        import fitz  # only needed for the Jinko datasheets
        index = int(url.rsplit("#", 1)[1])
        doc = fitz.open(stream=raw, filetype="pdf")
        xref = doc[0].get_images(full=True)[index][0]
        pix = fitz.Pixmap(doc, xref)
        if pix.n - pix.alpha > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        return Image.open(io.BytesIO(pix.tobytes("png")))
    return Image.open(io.BytesIO(raw))


def main():
    write = "--write" in sys.argv
    targets = {t["slug"]: t for t in json.loads(
        (ROOT / "chloride-missing-imagery.json").read_text(encoding="utf-8"))}

    provenance = json.loads((ROOT / "image-provenance.json").read_text(encoding="utf-8"))
    known = {e["file"] for e in provenance}
    patch = {}

    for slug, (source, entries) in PLAN.items():
        target = targets[slug]
        dest = PUB / target["category"] / slug
        images = []
        for i, (url, view) in enumerate(entries, 1):
            try:
                img = load(url)
            except Exception as exc:
                print(f"  {slug} {i:02d}: FAILED {exc}")
                continue
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGBA")
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
        (ROOT / "image-provenance.json").write_text(
            json.dumps(provenance, indent=2, ensure_ascii=False), encoding="utf-8")
    (ROOT / "chloride-image-patch.json").write_text(
        json.dumps(patch, indent=1, ensure_ascii=False), encoding="utf-8")

    total = sum(len(v) for v in patch.values())
    print(f"\n{total} images for {len(patch)} products"
          f"{'' if write else ' (dry run — pass --write)'}")
    print(f"{len(SKIPPED)} products left without a photograph on purpose")


if __name__ == "__main__":
    main()
