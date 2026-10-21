"""Photographs the 4 August 2026 wholesale rows, which were imported live but blank.

`scripts/import-wholesale-2026-08.mjs` published all 37 rows with `images: []`,
so the storefront has been showing "photograph coming soon" on live, priced,
buyable products. That is the one thing the rest of this catalogue has always
refused to do. This pass closes as much of that gap as can be closed honestly.

Where it comes from, and why the source can be trusted:

  Solis    solisinverters.com is Ginlong's own site and publishes a five- or
           six-shot studio gallery per inverter family, keyed to the power band
           the family covers. The wholesale list gives a rating and a phase but
           no model code, so each row takes the family whose published band
           contains its rating — every one of the fourteen lands inside a band,
           none is stretched to a neighbour. Four of the six families are
           already on disk from the earlier Solis pass, with the same source
           URLs; those rows point at the existing files rather than duplicate
           them.
  Dyness   dyness.com photographs each battery on white for its product index.
           PowerBrick is 51.2V 280Ah (14.336 kWh) and PowerBrick MAX is 314Ah
           (16.08 kWh), which is what fixes those two rows to those two shots —
           the capacity in the row name matches one product and no other.
  LONGi    static.longi.com serves the Hi-MO 9 module gallery, including the
           rear shot that shows the bifacial backsheet. Hi-MO 9 is the LONGi
           bifacial family whose band contains 650 W.

Twenty of the thirty-seven are deliberately left alone; see SKIPPED at the
bottom for the reason on each. A wrong photograph is worse than an honest gap.

    python data/harvest_wholesale_imagery.py            # download + report
    python data/harvest_wholesale_imagery.py --write    # also write webp + json
    node scripts/apply-wholesale-imagery.mjs --apply    # then push to Supabase

wholesale-missing-imagery.json is the slug/name/category of every wholesale row
that had no imagery, taken from Supabase — these rows live only in the database,
not in products.json, the same way the Chloride Exide import does. To rebuild it:

    select slug, name, category, brand, retail_price from products
    where source_supplier = 'Wholesale list' and coalesce(images, '[]') = '[]'
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
CACHE = ROOT / ".wholesale-image-cache"
TODAY = date.today().isoformat()
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

SOLIS = "https://cmsdata.solisinverters.com/upload/"
DYNESS = "https://www.dyness.com/Public/Uploads/uploadfile/images/"
LONGI = "https://static.longi.com/"

SOLIS_SRC = "solisinverters.com CMS (official Ginlong Solis site)"
DYNESS_SRC = "dyness.com (official Dyness product index photography)"
LONGI_SRC = "longi.com (official LONGi Hi-MO 9 module photography)"

# ---------------------------------------------------------------------------
# Solis families. Each entry is the asset directory the shots live in, the
# band the family covers, and the gallery itself. Four directories already
# exist from the earlier Solis pass and carry these exact files; `existing`
# marks those so the harvest references them instead of re-downloading.
# ---------------------------------------------------------------------------
FAMILIES = {
    "eh1p-3-10k-l-plus": {
        "model": "S6-EH1P(3-10)K-L-PLUS",
        "dir": "inverters/solis-s6-eh1p5k-l",
        "existing": True,
        "shots": [
            (SOLIS + "2024-12-09/1733736553332_97002c6f-ece8-4324-a09c-c03cdde5b935.png",
             "front view"),
            (SOLIS + "2024-12-09/1733736561935_eeb90d93-f420-4f48-b4ae-86f7176dc389.png",
             "side view"),
            (SOLIS + "2024-12-10/1733819318960_b455e123-73f3-46db-8c10-241fb4481469.png",
             "terminal detail"),
        ],
    },
    "eh1p-12-18k-l": {
        "model": "S6-EH1P(12-18)K03-NV-YD-L",
        "dir": "inverters/solis-s6-eh1p12k-l",
        "existing": True,
        "shots": [
            (SOLIS + "2024-05-25/2024-05-25-110647_1716606407630.png", "front view"),
            (SOLIS + "2024-05-25/2024-05-25-110653_1716606413782.png", "alternate view"),
        ],
    },
    "eh3p-5-18k-l": {
        "model": "S6-EH3P(5-18)K02-NV-YD-L",
        "dir": "inverters/solis-15kw-three-phase-hybrid-inverter-l",
        "shots": [
            (SOLIS + "2024-05-28/2024-05-28-165513_1716886513302.png", "front view"),
            (SOLIS + "2024-05-28/2024-05-28-165519_1716886519404.png", "side view"),
            (SOLIS + "2024-05-28/2024-05-28-165536_1716886536273.png", "terminal detail"),
        ],
    },
    "eh3p-15-20k-h": {
        "model": "S6-EH3P(15-20)K-H",
        "dir": "inverters/solis-20kw-three-phase-hybrid-inverter-h",
        "shots": [
            (SOLIS + "2024-06-06/2024-06-06-145335_1717656815328.png", "front view"),
            (SOLIS + "2024-06-06/2024-06-06-145342_1717656822371.png", "side view"),
            (SOLIS + "2024-06-06/2024-06-06-145402_1717656842233.png", "terminal detail"),
        ],
    },
    "eh3p-30-60k-h": {
        "model": "S6-EH3P(30-60)K-H(21A)",
        "dir": "inverters/solis-s6-eh3p30k-h",
        "existing": True,
        "shots": [
            (SOLIS + "2025-11-04/1762246539819_6ff1ca53-79f5-4d7b-9d7b-7097f08eac56.png",
             "front view"),
            (SOLIS + "2025-11-04/1762246546843_b4eccd7c-c738-4c3e-9b71-a73e00a6b5b7.png",
             "alternate view"),
        ],
    },
    "eh3p-80-125k-h": {
        "model": "S6-EH3P(80-125)K10-NV-YD-H",
        "dir": "inverters/solis-80kw-three-phase-hybrid-inverter-h",
        "shots": [
            (SOLIS + "2025-04-01/1743491615532_6a12b649-7cad-42e1-999e-3cbfe270884b.png",
             "front view"),
            (SOLIS + "2025-04-01/1743491623681_bbe2b1be-65ed-480f-8241-6a54bd5eea23.png",
             "side view"),
            (SOLIS + "2025-07-02/1751455367794_0b647df5-8e5d-4e73-a648-6eeff8420ec2.png",
             "terminal detail"),
        ],
    },
}

# Each Solis row takes the family whose published band contains its rating.
# The band is in the comment rather than the alt text: a screen reader reading
# "20kW ... 15-20K" out loud is noise, and the alt text already says the shot
# is of the series rather than of the individual unit.
SOLIS_ASSIGNMENT = {
    "solis-5kw-hybrid-inverter-48v": "eh1p-3-10k-l-plus",              # 3~10kW
    "solis-6kw-hybrid-inverter-48v": "eh1p-3-10k-l-plus",              # 3~10kW
    "solis-8kw-hybrid-inverter-48v": "eh1p-3-10k-l-plus",              # 3~10kW
    "solis-10kw-single-phase-hybrid-inverter": "eh1p-3-10k-l-plus",    # 3~10kW
    "solis-12kw-single-phase-hybrid-inverter-l": "eh1p-12-18k-l",      # 12~18kW
    "solis-14kw-single-phase-hybrid-inverter-l": "eh1p-12-18k-l",      # 12~18kW
    "solis-16kw-single-phase-hybrid-inverter-l": "eh1p-12-18k-l",      # 12~18kW
    "solis-15kw-three-phase-hybrid-inverter-l": "eh3p-5-18k-l",        # 5~18kW
    "solis-18kw-three-phase-hybrid-inverter-l": "eh3p-5-18k-l",        # 5~18kW
    "solis-20kw-three-phase-hybrid-inverter-h": "eh3p-15-20k-h",       # 15~20kW
    "solis-30kw-three-phase-hybrid-inverter-h": "eh3p-30-60k-h",       # 30~60kW
    "solis-50kw-three-phase-hybrid-inverter-h": "eh3p-30-60k-h",       # 30~60kW
    "solis-80kw-three-phase-hybrid-inverter-h": "eh3p-80-125k-h",      # 80~125kW
    "solis-125kw-three-phase-hybrid-inverter-h": "eh3p-80-125k-h",     # 80~125kW
}

# slug -> (source label, [(url, view)]). Solis is filled in below.
PLAN = {
    "dyness-powerbrick-14-3kwh-lithium-battery": (DYNESS_SRC, [
        (DYNESS + "20241021/1-558.png", "front view"),
    ]),
    "dyness-powerbrick-max-16-08kwh-lithium-battery": (DYNESS_SRC, [
        (DYNESS + "20260605/suoluetu9.png", "front view"),
    ]),
    "longi-650w-bifacial-solar-panel-anti-shade-anti-dust": (LONGI_SRC, [
        (LONGI + "Hi_MO_9_d9d1451b0d.png", "front view"),
        (LONGI + "Hi_MO_9_8f7fb3dbfe.png", "frame and glass detail"),
        (LONGI + "Hi_MO_9_571c378687.png", "rear view showing the bifacial backsheet"),
    ]),
}

SKIPPED = {
    # ---------- Dyness ----------
    "dyness-5-12kwh-lithium-battery":
        "Dyness publish four different 5.12 kWh low-voltage batteries — "
        "PowerDepot G2, DL5.0C, DL5.0C Pro and DL5.0F — and they do not look "
        "alike. The wholesale list gives no model, so there is no way to tell "
        "which one this row sells.",
    "dyness-hv4-battery-disconnect-unit":
        "PowerRack HV4 appears only in the model filter on dyness.com; it has "
        "no product page and no photograph anywhere on the site.",
    "dyness-hv4-5-12kwh-battery-module": "As above — PowerRack HV4 is unlisted.",
    "dyness-stack100-battery-disconnect-unit":
        "Dyness photograph STACK100 only as a complete stack of a disconnect "
        "unit and up to fifteen modules. This row sells the disconnect unit "
        "alone, and a shot of the whole stack against a one-part price reads "
        "as the stack being what is for sale. Same refusal as the Deye BOS-G "
        "Pro rows.",
    "dyness-stack100-5-12kwh-battery-module":
        "As above — the only STACK100 photograph is of the assembled stack, "
        "not of the single 5.12 kWh module this row sells.",
    "dyness-stack280-battery-disconnect-unit": "As STACK100 above.",
    "dyness-stack280-14-3kwh-battery-module": "As STACK100 above.",

    # ---------- X-Batt ----------
    "x-batt-5-12kwh-lithium-battery":
        "Xbatt Energy Technology (szxbatt.com) is the manufacturer, but the "
        "only lithium product they publish is a VRLA replacement cell. The "
        "wall-mounted ESS range sold here appears on Kenyan resellers' sites "
        "and nowhere on Xbatt's own, and a competitor's photograph is not a "
        "source this catalogue uses.",
    "x-batt-10-24kwh-lithium-battery": "As above.",
    "x-batt-16kwh-lithium-battery": "As above.",

    # ---------- SolarPro ----------
    "solarpro-10-2kw-hybrid-inverter-48v":
        "No manufacturer trades as SolarPro. A 10.2kW 48V hybrid is a common "
        "OEM chassis sold under many badges (PowMr POW-HVM10.2M, Y&H, Todamu "
        "and others), and they are not the same unit to look at. Confirm the "
        "actual make with the supplier before a photograph means anything.",

    # ---------- Solar water heaters ----------
    "pressurised-heat-pipe-solar-water-heater-200l":
        "Imported with no brand and no model code. Every manufacturer's "
        "200L pressurised heat-pipe heater looks like every other one in a "
        "photograph, so any shot chosen would be a picture of some other "
        "company's product. One warehouse photograph settles all five.",
    "pressurised-heat-pipe-solar-water-heater-300l": "As above.",
    "pressurised-flat-plate-solar-water-heater-300l": "As above.",
    "stainless-coil-vacuum-tube-solar-water-heater-200l": "As above.",
    "stainless-coil-vacuum-tube-solar-water-heater-300l": "As above.",

    # ---------- Lighting ----------
    "solar-flood-light-pa-b100":
        "PA-B100 returns nothing from any manufacturer. The PA- and Y- codes "
        "look like a distributor's own numbering rather than a maker's.",
    "solar-flood-light-pa-a200": "As above — PA-A200 is unattributable.",
    "solar-flood-light-y-200": "As above — Y-200 is unattributable.",
    "solar-street-light-pa-h200": "As above — PA-H200 is unattributable.",
}

for slug, family in SOLIS_ASSIGNMENT.items():
    fam = FAMILIES[family]
    PLAN[slug] = (SOLIS_SRC, [(url, f"{view} ({fam['model']} series photograph)")
                              for url, view in fam["shots"]])


def fetch(url):
    """Downloads url once and keeps it, so a rerun costs nobody a request."""
    CACHE.mkdir(exist_ok=True)
    key = CACHE / hashlib.sha1(url.encode()).hexdigest()[:16]
    if key.exists():
        return key.read_bytes()
    host = urllib.parse.urlparse(url).netloc
    req = urllib.request.Request(url, headers={
        "User-Agent": UA, "Referer": f"https://{host}/"})
    raw = urllib.request.urlopen(req, timeout=60).read()
    key.write_bytes(raw)
    return raw


def flatten(img):
    """Puts transparent shots on white so the webp matches the rest of the set."""
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA")
    if img.mode == "RGBA":
        canvas = Image.new("RGB", img.size, (255, 255, 255))
        canvas.paste(img, mask=img.split()[3])
        return canvas
    return img


def asset_dir(slug, category):
    """Where a slug's shots live: a shared Solis family directory, or its own."""
    family = SOLIS_ASSIGNMENT.get(slug)
    if family:
        return FAMILIES[family]["dir"]
    return f"{category}/{slug}"


def main():
    write = "--write" in sys.argv
    targets = {p["slug"]: p for p in json.loads(
        (ROOT / "wholesale-missing-imagery.json").read_text(encoding="utf-8"))}

    stray = [s for s in list(PLAN) + list(SKIPPED) if s not in targets]
    if stray:
        raise SystemExit(f"not a wholesale row missing imagery: {', '.join(stray)}")
    unhandled = [s for s in targets if s not in PLAN and s not in SKIPPED]
    if unhandled:
        raise SystemExit(f"neither planned nor skipped: {', '.join(unhandled)}")

    provenance = json.loads((ROOT / "image-provenance.json").read_text(encoding="utf-8"))
    known = {e["file"] for e in provenance}
    patch = {}

    for slug, (source, entries) in PLAN.items():
        target = targets[slug]
        rel_dir = asset_dir(slug, target["category"])
        dest = PUB / rel_dir
        images = []
        for i, (url, view) in enumerate(entries, 1):
            rel = f"/products/{rel_dir}/{i:02d}.webp"
            on_disk = (dest / f"{i:02d}.webp").exists()
            size = None
            if not on_disk:
                try:
                    img = flatten(Image.open(io.BytesIO(fetch(url))))
                except Exception as exc:
                    print(f"  {slug} {i:02d}: FAILED {exc}")
                    continue
                size = img.size
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
                "type": "primary" if i == 1 else ("detail" if i == 3 else "angle"),
            })
            if rel not in known:
                provenance.append({"file": rel, "source_url": url,
                                   "source": source, "retrieved": TODAY})
                known.add(rel)
        patch[slug] = images
        where = "reused" if all((dest / f"{i:02d}.webp").exists()
                                for i in range(1, len(entries) + 1)) else "new"
        print(f"  {slug}: {len(images)} image(s)  [{where}: {rel_dir}]")

    if write:
        (ROOT / "image-provenance.json").write_text(
            json.dumps(provenance, indent=2, ensure_ascii=False), encoding="utf-8")
    (ROOT / "wholesale-image-patch.json").write_text(
        json.dumps(patch, indent=1, ensure_ascii=False), encoding="utf-8")

    total = sum(len(v) for v in patch.values())
    print(f"\n{total} images for {len(patch)} products"
          f"{'' if write else ' (dry run — pass --write)'}")
    print(f"{len(SKIPPED)} products left without a photograph on purpose")


if __name__ == "__main__":
    main()
