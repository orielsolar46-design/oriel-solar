# Stage 2 rollout: assigns verified official family imagery to catalogue SKUs,
# converts to WebP (1600px + 400px thumb), records provenance, and reports
# which published SKUs remain on the branded placeholder.
#
# Family galleries were taken from the manufacturers' own product pages for the
# exact model families listed. Where a brand's official assets could not be
# retrieved (bot protection, JS-only sites, no web presence), the SKU keeps an
# empty image list and the storefront renders the sun-arc placeholder.
import json
from datetime import date
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent.parent
FAM = Path(r"C:\Users\WEBSER~1\AppData\Local\Temp\claude\C--Users-WebSergeINTL-Desktop-Orielsolar\63d5e4ac-5e6e-4225-a4a6-d09b0e9f4b91\scratchpad\fam")
IMG = Path(r"C:\Users\WEBSER~1\AppData\Local\Temp\claude\C--Users-WebSergeINTL-Desktop-Orielsolar\63d5e4ac-5e6e-4225-a4a6-d09b0e9f4b91\scratchpad\img")
PUB = ROOT / "public" / "products"
TODAY = date.today().isoformat()

LVT = "https://www.livoltek.com/wp-content/uploads/2025/03"
SOLIS = "https://cmsdata.solisinverters.com/upload"

# family -> (source_label, [(file, source_url, view)])
FAMILIES = {
    "gf1_small": ("livoltek.com (official)", [
        (FAM / "gf1_small" / "front.png", f"{LVT}/1119-3-6正.png", "front view"),
        (FAM / "gf1_small" / "side.webp", f"{LVT}/1119-3-6右侧.webp", "side view"),
    ]),
    "gf1_big": ("livoltek.com (official)", [
        (FAM / "gf1_big" / "a.png", f"{LVT}/A11-2.png", "three-quarter view"),
        (FAM / "gf1_big" / "b.png", f"{LVT}/A22.png", "alternate view"),
    ]),
    "hp1_small": ("livoltek.com (official)", [
        (FAM / "hp1_small" / "front.png", f"{LVT}/hp1-3-6s2.png", "front view"),
        (FAM / "hp1_small" / "b2.png", f"{LVT}/Beauty2.png", "detail view"),
    ]),
    "hp1_big": ("livoltek.com (official)", [
        (FAM / "hp1_big" / "front.png", f"{LVT}/hp1-7-16s2.png", "front view"),
        (FAM / "hp1_big" / "side.png", f"{LVT}/右侧图.png", "side view"),
    ]),
    "hp3_d2": ("livoltek.com (official)", [
        (FAM / "hp3_d2" / "a.webp", f"{LVT}/10000-2.webp", "front view"),
        (FAM / "hp3_d2" / "b.webp", f"{LVT}/10001.webp", "alternate view"),
        (FAM / "hp3_d2" / "c.webp", f"{LVT}/10002-1.webp", "detail view"),
    ]),
    "hp3_t2": ("livoltek.com (official)", [
        (FAM / "hp3_t2" / "a.webp", f"{LVT}/1-2.webp", "three-quarter view"),
        (FAM / "hp3_t2" / "b.webp", f"{LVT}/2-2.webp", "alternate view"),
        (FAM / "hp3_t2" / "c.webp", f"{LVT}/3.webp", "detail view"),
    ]),
    "gt3_small": ("livoltek.com (official)", [
        (FAM / "gt3_small" / "front.webp", f"{LVT}/F-7.webp", "front view"),
        (FAM / "gt3_small" / "left.webp", f"{LVT}/L-2.webp", "left view"),
        (FAM / "gt3_small" / "right.webp", f"{LVT}/R-3.webp", "right view"),
    ]),
    "gt3_big": ("livoltek.com (official)", [
        (FAM / "gt3_big" / "front.webp", f"{LVT}/F-8.webp", "front view"),
        (FAM / "gt3_big" / "left.webp", f"{LVT}/L-3.webp", "left view"),
    ]),
    "blf_12100": ("livoltek.com (official)", [
        (FAM / "blf_small" / "l12100.webp", f"{LVT}/BLF-12100-L.webp", "left view"),
        (FAM / "blf_small" / "r12100.webp", f"{LVT}/BLF-12100-R.webp", "right view"),
    ]),
    "blf_24100": ("livoltek.com (official)", [
        (FAM / "blf_small" / "f24100.webp", f"{LVT}/BLF-24100-F.webp", "front view"),
        (FAM / "blf_small" / "l24100.webp", f"{LVT}/BLF-24100-L.webp", "left view"),
    ]),
    "bhf_s": ("livoltek.com (official)", [
        (FAM / "bhf_s" / "front.webp", f"{LVT}/F-17.webp", "front view"),
        (FAM / "bhf_s" / "left.webp", f"{LVT}/L-11.webp", "left view"),
        (FAM / "bhf_s" / "right.webp", f"{LVT}/R-12.webp", "right view"),
    ]),
    "bhf_g": ("livoltek.com (official)", [
        (FAM / "bhf_g" / "b.png", f"{LVT}/a3-2.png", "rack system view"),
        (FAM / "bhf_g" / "a.png", f"{LVT}/1-1-3.png", "module stack view"),
    ]),
    "luminblock": ("livoltek.com (official)", [
        (FAM / "luminblock" / "b.png", f"{LVT}/未标题-1-14.png", "cabinet view"),
        (FAM / "luminblock" / "right45.png", f"{LVT}/02.-45°-Right-View-1.png", "battery module 45° view"),
    ]),
    "hyper": ("livoltek.com (official)", [
        (FAM / "hyper" / "a.png", "https://www.livoltek.com/wp-content/uploads/2025/09/上新.png", "stack front view"),
    ]),
    "wifi": ("livoltek.com (official)", [
        (FAM / "wifi" / "dongle.png", f"{LVT}/未标题-12__1_-removebg-preview.png", "front view"),
    ]),
    "hx_light": ("livoltek.com (official Livoltek/Hexing)", [
        (IMG / "light" / "hx-sl-series.png", f"{LVT}/太阳能照明.1288.png", "pole-mounted view"),
    ]),
    "solis_1p_lv": ("solisinverters.com (official)", [
        (IMG / "inverter" / "cand2.png", f"{SOLIS}/2024-12-09/1733736553332_97002c6f-ece8-4324-a09c-c03cdde5b935.png", "front view"),
        (IMG / "inverter" / "cand4.png", f"{SOLIS}/2024-12-09/1733736561935_eeb90d93-f420-4f48-b4ae-86f7176dc389.png", "side view"),
        (IMG / "inverter" / "cand6.png", f"{SOLIS}/2024-12-10/1733819318960_b455e123-73f3-46db-8c10-241fb4481469.png", "terminal detail"),
    ]),
    "solis_eo1p": ("solisinverters.com (official)", [
        (FAM / "solis_eo1p" / "1.png", f"{SOLIS}/2023-10-19/1697701125554_88bd6030-6e52-11ee-bc10-5da8d764d48b.png", "front view"),
        (FAM / "solis_eo1p" / "2.png", f"{SOLIS}/2023-10-19/1697701139170_90dadc20-6e52-11ee-bc10-5da8d764d48b.png", "alternate view"),
    ]),
    "solis_eh1p_big": ("solisinverters.com (official)", [
        (FAM / "solis_eh1p_big" / "1.png", f"{SOLIS}/2024-05-25/2024-05-25-110647_1716606407630.png", "front view"),
        (FAM / "solis_eh1p_big" / "2.png", f"{SOLIS}/2024-05-25/2024-05-25-110653_1716606413782.png", "alternate view"),
    ]),
    "solis_eh3p_hv_small": ("solisinverters.com (official)", [
        (FAM / "solis_eh3p_hv_small" / "1.png", f"{SOLIS}/2024-11-14/1731563913591_87cff292-58ee-417f-a978-33bb713253fc.png", "front view"),
        (FAM / "solis_eh3p_hv_small" / "2.png", f"{SOLIS}/2024-11-14/1731563918450_f8e7f9d9-7d30-42d3-bd46-39868157aa82.png", "alternate view"),
    ]),
    "solis_eh3p_hv_big": ("solisinverters.com (official)", [
        (FAM / "solis_eh3p_hv_big" / "1.png", f"{SOLIS}/2025-11-04/1762246539819_6ff1ca53-79f5-4d7b-9d7b-7097f08eac56.png", "front view"),
        (FAM / "solis_eh3p_hv_big" / "2.png", f"{SOLIS}/2025-11-04/1762246546843_b4eccd7c-c738-4c3e-9b71-a73e00a6b5b7.png", "alternate view"),
    ]),
    "solis_gc50": ("solisinverters.com (official)", [
        (FAM / "solis_gc3p_50" / "1.png", f"{SOLIS}/2024-07-08/2024-07-08-143643_1720420603499.png", "front view"),
        (FAM / "solis_gc3p_50" / "2.png", f"{SOLIS}/2024-07-08/2024-07-08-143647_1720420607751.png", "alternate view"),
    ]),
    "solis_gc100": ("solisinverters.com (official)", [
        (FAM / "solis_gc_100" / "1.png", f"{SOLIS}/2026-01-05/1767579737075_6978d3b9-ceb9-4b1e-ae25-d99df65fddd3.png", "front view"),
        (FAM / "solis_gc_100" / "2.png", f"{SOLIS}/2026-01-05/1767579754296_00cc9bdd-ce8c-4bd0-849e-93718e3ece8c.png", "alternate view"),
    ]),
    "jinko_bifacial": ("jinkosolar.eu (official)", [
        (IMG / "panel" / "tiger-07.png", "https://jinkosolar.eu/wp-content/uploads/2025/08/JinKo-Solar-Tiger-Neo-Bifacial-66-HC-Dual-Glass-07.png", "front view on white"),
        (IMG / "panel" / "tiger-front.png", "https://jinkosolar.eu/wp-content/uploads/2025/04/Tiger-Neo-Bifacial-66-HC-Dual-Glass-1-revised.png", "full-face cell detail"),
    ]),
}

# family -> model codes it covers (resolved against products.json)
ASSIGN = {
    "gf1_small": ["GF1-3K24S1", "GF1-3K24S1R11001", "GF1-3K524S2", "GF1-6K248S3", "GF1-6KS2R11002"],
    "gf1_big": ["GF1-8KS2-T", "GF1-12KS2-T"],
    "hp1_small": ["HP1-6KS2R11002"],
    "hp1_big": ["HP1-8KS2MR11002", "HP1-12KS2R11002"],
    "hp3_d2": ["HP3-10KD1W00101", "HP3-15KD1W00101"],
    "hp3_t2": ["HP3-15KT2R11001", "HP3-20KT2R11001", "HP3-25KT2R11001", "HP3-30KT2R11002"],
    "gt3_small": ["GT3-10KD1R11006", "GT3-15KD1R11006", "GT3-20KD1R11006", "GT3-25KD1R11006"],
    "gt3_big": ["GT3-30K-D2R11006", "GT3-50K-T2R11001", "GT3-60K-Q2R11001"],
    "blf_12100": ["BLF-12100R21001"],
    "blf_24100": ["BLF-24100R11001"],
    "bhf_s": ["BHF-S10R11001", "BHF-S15R11001", "BHF-S20R11001", "BHF-S25R11001", "BHF-S30R11001"],
    "bhf_g": ["BHF-G20.R110", "BHF-G25.R110", "BHF-G30.R110", "BHF-G35.R110", "BHF-G40.R110",
               "BHF-G45.R110", "BHF-G50.R110", "BHF-G55.R110", "BHF-G60.R110", "BHF-R01R11001"],
    "luminblock": ["BHF-X261DR11001", "BES-P125X261E-T"],
    "hyper": ["HYPER-5000R31003", "HYPER-5000R31005", "HYPER-6000R11001"],
    "wifi": ["PSD300.R310"],
    "hx_light": ["HX-SL-40N-490", "HX-SL-60N-500", "HX-SL-80NW-510", "HX-SL-80N-520", "HX-SL-100N-530"],
    "solis_1p_lv": ["S6-EH1P5K-L", "S6-EH1P8K-L", "S6-EH1P10K-L"],
    "solis_eo1p": ["S6-EO1P5K-48"],
    "solis_eh1p_big": ["S6-EH1P12K-L", "S6-EH1P16K-L"],
    "solis_eh3p_hv_small": ["S6-EH3P10K-H"],
    "solis_eh3p_hv_big": ["S6-EH3P30K-H", "S6-EH3P50K-H"],
    "solis_gc50": ["S6-GT3P50K"],
    "solis_gc100": ["S6-GT3P100K"],
    "jinko_bifacial": ["JKM615-BF", "JKM625-BF"],
}

products = json.loads((ROOT / "data" / "products.json").read_text(encoding="utf-8"))
by_model = {}
for p in products:
    by_model.setdefault(p["model_code"], p)

provenance = json.loads((ROOT / "data" / "image-provenance.json").read_text(encoding="utf-8"))
seen_files = {e["file"] for e in provenance}

# The Hyper render carries a baked-in "NEW" badge top-left; crop it off.
def load(src, family):
    img = Image.open(src)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA")
    if family == "hyper":
        w, h = img.size
        img = img.crop((0, int(h * 0.10), w, h))
    return img


converted = 0
for family, models in ASSIGN.items():
    label, files = FAMILIES[family]
    for model in models:
        p = by_model.get(model)
        if p is None:
            print(f"!! model not found: {model}")
            continue
        if p["images"]:                      # proof products keep their curated set
            continue
        dest = PUB / p["category"] / p["slug"]
        dest.mkdir(parents=True, exist_ok=True)
        entries = []
        for i, (src, url, view) in enumerate(files, 1):
            img = load(src, family)
            main = img.copy(); main.thumbnail((1600, 1600), Image.LANCZOS)
            main.save(dest / f"{i:02d}.webp", "WEBP", quality=88)
            thumb = img.copy(); thumb.thumbnail((400, 400), Image.LANCZOS)
            thumb.save(dest / f"{i:02d}-thumb.webp", "WEBP", quality=82)
            rel = f"/products/{p['category']}/{p['slug']}/{i:02d}.webp"
            typ = "primary" if i == 1 else ("detail" if "detail" in view else "angle")
            entries.append({"url": rel, "alt": f"{p['name']} — {view} (official series photograph)", "type": typ})
            if rel not in seen_files:
                provenance.append({"file": rel, "source_url": url, "source": label, "retrieved": TODAY})
                seen_files.add(rel)
            converted += 1
        p["images"] = entries

(ROOT / "data" / "products.json").write_text(json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8")
(ROOT / "data" / "image-provenance.json").write_text(json.dumps(provenance, indent=2, ensure_ascii=False), encoding="utf-8")

with_img = [p for p in products if p["images"] and p["is_published"]]
without = [p for p in products if not p["images"] and p["is_published"]]
print(f"{converted} files converted; {len(with_img)} published SKUs with official imagery, {len(without)} on placeholder")
brands = {}
for p in without:
    brands.setdefault(p["brand"], 0)
    brands[p["brand"]] += 1
for b, n in sorted(brands.items(), key=lambda kv: -kv[1]):
    print(f"  placeholder: {b:20s} {n}")
