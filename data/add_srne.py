"""Adds the SRNE range to data/products.json from the client's supplied prices.

PRICE BASIS: the figures come from a supplier price message ("UPDATED SRNE
PRICES"), matching the pattern of every other supplier communication in this
project — so they are treated as COST, with retail derived by the usual markup.

That direction is the safe error. If they turn out to be retail prices we will
have over-priced and lost some sales; if we had assumed retail and they were
cost, Oriel would sell at cost and lose money on every unit. Flagged in
PLACEHOLDERS.md for the client to confirm.

Only products that map confidently to an SRNE catalogue page (and therefore to
real photography) are added. Ambiguous lines from the price list are printed
at the end rather than guessed at.
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent
products = json.loads((ROOT / "products.json").read_text(encoding="utf-8"))
srne_images = json.loads((ROOT / "srne-images.json").read_text(encoding="utf-8"))

SUPPLIER = "SRNE (supplier price list)"
LIST_DATE = "2026-07"

# (model, name, cost, category, subcategory, srne_page_slug, key_specs, short)
ITEMS = [
    # ---- Inverters ----
    ("AEP-6K", "SRNE AEP 6kW Off-Grid Inverter", 90_000, "inverters", "off-grid",
     "Off-Grid-Inverter-AEP-6kW", ["6 kW", "Off-grid", "Single phase"],
     "6kW off-grid inverter for sites running entirely on solar and battery."),
    ("HESP-6K", "SRNE HESP 6kW Hybrid Inverter", 100_000, "inverters", "hybrid",
     "Hybrid-Inverter-HESP-3-6kW-EU", ["6 kW", "Hybrid", "Single phase"],
     "6kW hybrid inverter running solar, battery and grid together with backup."),
    ("HESP-8K", "SRNE HESP 8kW Hybrid Inverter", 145_000, "inverters", "hybrid",
     "Hybrid-Inverter-HESP-8-12kW-EU", ["8 kW", "Hybrid", "Single phase"],
     "8kW hybrid inverter for larger homes and small commercial premises."),
    ("HESP-12K", "SRNE HESP 12kW Hybrid Inverter, Single or Three Phase", 210_000,
     "inverters", "hybrid", "Hybrid-Inverter-Single-Phase-Low-HESP-8-12kW-EU",
     ["12 kW", "Hybrid", "1 or 3 phase"],
     "12kW hybrid inverter available in single- or three-phase configuration."),
    ("ASP-10K", "SRNE ASP 10kW Off-Grid Inverter", 135_000, "inverters", "off-grid",
     "Off-Grid-Inverter-ASP-8-12kW-EU", ["10 kW", "Off-grid", "Single phase"],
     "10kW off-grid inverter for larger standalone installations."),
    ("HESP-16K-3P", "SRNE HESP 16kW Three-Phase Hybrid Inverter", 325_000,
     "inverters", "hybrid", "Hybrid-Inverter-HESP-14-18kW-EU",
     ["16 kW", "Hybrid", "Three phase"],
     "16kW three-phase hybrid inverter for commercial sites."),
    ("HESP-20K-3P", "SRNE HESP 20kW Three-Phase Hybrid Inverter", 350_000,
     "inverters", "hybrid", "Hybrid-Inverter-HESP-16-20kW-EU",
     ["20 kW", "Hybrid", "Three phase"],
     "20kW three-phase hybrid inverter for larger commercial installations."),
    ("AFP-5K", "SRNE AFP 5kW Off-Grid Inverter, 500Vdc", 70_000, "inverters", "off-grid",
     "Off-Grid-Inverter-AFP-5kW-EU", ["5 kW", "500 Vdc", "Off-grid"],
     "5kW off-grid inverter with a 500Vdc PV input window."),

    # ---- Batteries / storage ----
    ("SE-5B", "SRNE SE05B Lithium Battery 5.12kWh, 100Ah", 99_000,
     "battery-storage", "wall-mounted-lv", "Energy-Storage-System-SE-5-15kWh",
     ["5.12 kWh", "51.2 V", "100 Ah"],
     "5.12kWh LiFePO4 wall battery from SRNE's SE series."),
    ("EOS-5B", "SRNE EOS05B Lithium Battery 5.12kWh, 100Ah", 112_000,
     "battery-storage", "wall-mounted-lv", "Energy-Storage-System-EOS-5kWh",
     ["5.12 kWh", "51.2 V", "100 Ah"],
     "5.12kWh LiFePO4 battery from SRNE's EOS series, with integrated display."),
    ("EOS-10B", "SRNE EOS10B Lithium Battery 10kWh, 200Ah", 248_000,
     "battery-storage", "wall-mounted-lv", "Energy-Storage-System-EOS-10kWh",
     ["10 kWh", "51.2 V", "200 Ah"],
     "10kWh LiFePO4 battery for whole-home storage."),
    ("SE-10B", "SRNE SE10B Lithium Battery 10kWh, 205Ah", 202_000,
     "battery-storage", "wall-mounted-lv", "Energy-Storage-System-SE-5-15kWh",
     ["10 kWh", "51.2 V", "205 Ah"],
     "10kWh LiFePO4 battery from SRNE's SE series."),
    ("SE-16B", "SRNE SE16B Lithium Battery 16kWh, 314Ah", 260_000,
     "battery-storage", "wall-mounted-lv", "Energy-Storage-System-SE-5-15kWh",
     ["16 kWh", "51.2 V", "314 Ah"],
     "16kWh LiFePO4 battery — the largest single unit in SRNE's SE series."),
    ("EOS-16B", "SRNE EOS16B Lithium Battery 16kWh, 314Ah", 290_000,
     "battery-storage", "wall-mounted-lv", "Energy-Storage-System-EOS-16kWh",
     ["16 kWh", "51.2 V", "314 Ah"],
     "16kWh LiFePO4 battery from SRNE's EOS series, with integrated display."),
]

# Price-list lines we could NOT map to a specific SRNE catalogue page.
UNMAPPED = [
    "1.5KW inverter — 26,000 (SRNE has several 1.5kW units; which model?)",
    "3kW 108Vdc — 36,000 (108Vdc is unusual; confirm the model code)",
    "3.3kW 500Vdc — 39,000 (confirm whether HESP or AFP series)",
    "6kW Hyp — 80,000 (no 'HYP' series on SRNE's site; confirm the model)",
    "24V 100Ah 2.56kWh — 59,000 (confirm model code)",
    "12V 200Ah 2.56kWh — 59,000 (confirm model code)",
]

existing = {p["model_code"] for p in products}
added = 0

for model, name, cost, category, sub, page, key_specs, short in ITEMS:
    if model in existing:
        print(f"  skip (exists): {model}")
        continue
    urls = srne_images.get(page, [])
    if not urls:
        print(f"  SKIPPED, no imagery: {model} ({page})")
        continue
    products.append({
        "id": f"srne-{model.lower()}",
        "slug": f"srne-{model.lower()}",
        "name": name,
        "brand": "SRNE",
        "model_code": model,
        "category": category,
        "subcategory": sub,
        "short_description": short,
        "long_description": None,
        "specs": [],
        "key_specs": key_specs,
        # Populated by the download step; recorded here so the mapping is auditable.
        "images": [],
        "_srne_page": page,
        "_srne_urls": urls,
        "cost_price": float(cost),
        "cost_per_watt": None,
        "module_watts": None,
        "pricing_note": (
            "Price taken from the supplier's 'UPDATED SRNE PRICES' message and "
            "treated as dealer cost. Confirm with SRNE whether these are cost "
            "or retail figures before launch."
        ),
        "price_status": "ok",
        # SRNE's message did not state VAT. Kenyan supplier quotes to a dealer
        # are normally VAT-exclusive, and that is the safer assumption: it
        # raises the retail price rather than eroding margin.
        "source_vat_inclusive": False,
        "warranty_years": None,
        "stock_status": "call_for_stock",
        "stock_qty": None,
        "lead_time_days": None,
        "weight_kg": None,
        "dimensions_mm": None,
        "requires_installation": True,
        "compatible_with": [],
        "annual_kwh_yield": None,
        "datasheet_url": None,
        "source_supplier": SUPPLIER,
        "source_list_date": LIST_DATE,
        "is_featured": False,
        "is_published": True,
        "seo_title": None,
        "seo_description": None,
    })
    added += 1

(ROOT / "products.json").write_text(
    json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8"
)

print(f"\nAdded {added} SRNE products (total now {len(products)})")
print("\nPrice-list lines NOT added — need the client to confirm the model:")
for line in UNMAPPED:
    print(f"  - {line}")
