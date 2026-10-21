# Builds data/products.json from the three supplier pricelists.
# Every cost figure below is transcribed from the source PDF (data/source/).
# Column used: the DEALER price wherever the list carries two price columns,
# otherwise the single price printed. Retail is NEVER computed here — it is
# derived at seed/runtime from RETAIL_MARKUP_PERCENT, VAT-normalised, and
# rounded up to the nearest KES 100 (see supabase migration function).
#
# VAT status per source:
#   Solargen  JULY 2026  — "Prices are inclussive of VAT (16%)"  -> vat True
#   Livoltek  (Hexing)   — "Prices are NOT inclusive of VAT"     -> vat False
#   Lekkerix  202606     — VAT not stated                        -> vat None -> needs_review
import json
import re
from pathlib import Path

OUT = Path(__file__).parent / "products.json"

SOLARGEN = ("Solargen Technologies", "2026-07", True)
LIVOLTEK = ("Hexing Africa / Livoltek", "2025-Q2 (as printed on list)", False)
LEKKERIX = ("Lekkerix Energy", "2026-06", None)

products = []


def slugify(text):
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return re.sub(r"-{2,}", "-", s)


def add(source, category, subcategory, brand, name, model, cost, warranty,
        short, key_specs, specs=None, *, published=True, status=None,
        stock="call_for_stock", qty=None, installs=True, featured=False,
        pricing_note=None, cost_per_watt=None, watts=None):
    supplier, list_date, vat = source
    if status is None:
        status = "ok" if vat is not None else "needs_review"
    slug = slugify(f"{brand} {model or name}")
    if any(p["slug"] == slug for p in products):
        slug = slugify(f"{brand} {name} {model or ''}")
    products.append({
        "id": slug,
        "slug": slug,
        "name": name,
        "brand": brand,
        "model_code": model,
        "category": category,
        "subcategory": subcategory,
        "short_description": short,
        "long_description": None,          # authored per approved pattern (Stage 2 proof, then rollout)
        "specs": specs or [],
        "key_specs": key_specs,
        "images": [],
        "cost_price": cost,                # INTERNAL — excluded from products_public view
        "retail_price": None,              # derived: cost x (1 + markup%) -> VAT-normalise -> round up to KES 100
        "price_status": status,
        "source_vat_inclusive": vat,
        "cost_per_watt": cost_per_watt,    # panels only, from per-watt source pricing
        "module_watts": watts,
        "pricing_note": pricing_note,
        "warranty_years": warranty,
        "stock_status": stock,
        "stock_qty": qty,
        "lead_time_days": None,
        "weight_kg": None,
        "dimensions_mm": None,
        "requires_installation": installs,
        "compatible_with": [],
        "annual_kwh_yield": None,
        "datasheet_url": None,
        "source_supplier": supplier,
        "source_list_date": list_date,
        "is_featured": featured,
        "is_published": published,
        "seo_title": None,
        "seo_description": None,
    })
    return products[-1]


def sg_stock(avail, expected=0):
    if avail and avail > 0:
        return ("in_stock" if avail > 3 else "low_stock"), avail
    if expected:
        return "on_order", 0
    return "call_for_stock", 0


# =====================================================================
# SOLARGEN — dealer column, VAT-inclusive
# =====================================================================

# --- Solar water heaters ---
add(SOLARGEN, "solar-water-heaters", "flat-plate", "Hanti",
    "Hanti JFP-300 Direct Pressurised Flat-Plate Solar Water Heater, 300L", "JFP-300",
    166460.00, None,
    "Pressurised 300-litre flat-plate solar water heater for a household of five to seven people.",
    ["300 L tank", "Flat-plate collector", "Direct pressurised"],
    stock="on_order", qty=0)
add(SOLARGEN, "solar-water-heaters", "spares", "Hanti", "Hanti JFP-300 Spare Tank", "JFP-300-TANK",
    86072.00, None, "Replacement 300-litre tank for the Hanti JFP-300 solar water heater.",
    ["300 L", "Replacement tank"], published=False, stock="in_stock", qty=7)
add(SOLARGEN, "solar-water-heaters", "spares", "Hanti", "Hanti JFP-200 Spare Tank", "JFP-200-TANK",
    69600.00, None, "Replacement 200-litre tank for the Hanti JFP-200 solar water heater.",
    ["200 L", "Replacement tank"], published=False, stock="low_stock", qty=2)
add(SOLARGEN, "solar-water-heaters", "spares", "Hanti", "Hanti Spare Flat-Plate Collector", "JFP-COLLECTOR",
    34163.16, None, "Replacement flat-plate collector panel for Hanti JFP series heaters.",
    ["Flat-plate collector"], published=False, stock="in_stock", qty=8)
add(SOLARGEN, "solar-water-heaters", "spares", "Hanti", "Hanti Spare Vacuum Tube", "JFP-VTUBE",
    1740.00, None, "Replacement vacuum tube for Hanti evacuated-tube solar water heaters.",
    ["Vacuum tube"], published=False, stock="in_stock", qty=135, installs=False)
add(SOLARGEN, "solar-water-heaters", "spares", "Hanti", "SR609 Solar Water Heater Temperature Controller", "SR609",
    12760.00, None, "Temperature and circulation controller for pressurised solar water heating systems.",
    ["Temperature control", "Mains powered"], stock="in_stock", qty=136, installs=False)

# --- PV modules ---
add(SOLARGEN, "solar-panels", "monocrystalline", "Jinko Solar",
    "Jinko Solar Monocrystalline PV Module, 445W", "JKM445",
    8900.00, None,
    "445W monocrystalline module for residential and commercial arrays.",
    ["445 W", "Monocrystalline"], watts=445, stock="in_stock", qty=265)
p_jinko_615 = add(SOLARGEN, "solar-panels", "bifacial", "Jinko Solar",
    "Jinko Solar Bifacial Monocrystalline PV Module, 615W", "JKM615-BF",
    11070.00, None,
    "615W bifacial monocrystalline module that also harvests light reflected onto its rear face.",
    ["615 W", "Bifacial", "Monocrystalline"], watts=615, stock="on_order", featured=True)
add(SOLARGEN, "solar-panels", "bifacial", "Jinko Solar",
    "Jinko Solar Bifacial Monocrystalline PV Module, 625W", "JKM625-BF",
    11250.00, None,
    "625W bifacial monocrystalline module for maximum yield per square metre of roof.",
    ["625 W", "Bifacial", "Monocrystalline"], watts=625, stock="on_order")

# --- Batteries ---
add(SOLARGEN, "battery-storage", "wall-mounted-lv", "Jinko Solar",
    "Jinko Battery 4.8kWh 48V 100Ah", "JKS-4.8", 115000.00, None,
    "4.8kWh 48V LiFePO4 battery matched to Jinko LV hybrid inverters.",
    ["4.8 kWh", "48 V", "100 Ah"], stock="low_stock", qty=3)
add(SOLARGEN, "battery-storage", "accessories", "Maqbul", "Maqbul Lithium Battery Wi-Fi Stick", "MQB-WIFI",
    2800.00, None, "Wi-Fi monitoring stick for Maqbul lithium batteries.",
    ["Wi-Fi monitoring"], stock="in_stock", qty=10, installs=False)
add(SOLARGEN, "battery-storage", "wall-mounted-lv", "Maqbul",
    "Maqbul Lithium Battery LV 5.12kWh 100Ah", "MQB-LV-5.12", 85000.00, None,
    "5.12kWh 51.2V LiFePO4 battery for low-voltage hybrid and off-grid systems.",
    ["5.12 kWh", "51.2 V", "100 Ah"], stock="in_stock", qty=108)
add(SOLARGEN, "battery-storage", "wall-mounted-lv", "Maqbul",
    "Maqbul Lithium Battery LV 10kWh 200Ah", "MQB-LV-10", 185000.00, None,
    "10kWh 51.2V LiFePO4 battery for whole-home low-voltage storage.",
    ["10 kWh", "51.2 V", "200 Ah"], stock="in_stock", qty=15)
add(SOLARGEN, "battery-storage", "wall-mounted-lv", "Maqbul",
    "Maqbul Lithium Battery LV 14.3kWh 280Ah", "MQB-LV-14.3", 190000.00, None,
    "14.3kWh 51.2V LiFePO4 battery for extended backup on low-voltage systems.",
    ["14.3 kWh", "51.2 V", "280 Ah"], stock="in_stock", qty=8)
add(SOLARGEN, "battery-storage", "wall-mounted-lv", "Maqbul",
    "Maqbul Lithium Battery LV 16.07kWh 314Ah", "MQB-LV-16", 220000.00, None,
    "16.07kWh 51.2V LiFePO4 battery — the largest single unit in the Maqbul LV range.",
    ["16.07 kWh", "51.2 V", "314 Ah"], stock="in_stock", qty=35)
add(SOLARGEN, "battery-storage", "high-voltage", "Maqbul",
    "Maqbul Lithium Battery HV 5.12kWh 100Ah", "MQB-HV-5.12", 92000.00, None,
    "5.12kWh high-voltage LiFePO4 battery module for stacked HV systems.",
    ["5.12 kWh", "High voltage", "100 Ah"], stock="in_stock", qty=252)
add(SOLARGEN, "battery-storage", "high-voltage", "Maqbul",
    "Maqbul BDU HV 100 Battery Distribution Unit", "MQB-BDU-HV100", 110200.00, None,
    "Battery distribution and control unit for Maqbul high-voltage battery stacks.",
    ["HV control unit", "100 A"], stock="in_stock", qty=31)

# --- All-in-one units & kits ---
add(SOLARGEN, "inverters", "all-in-one-ess", "Maqbul",
    "Maqbul All-in-One 5kW with 5.12kWh Storage", "MQB-AIO-5-5", 230000.00, None,
    "Integrated 5kW hybrid inverter and 5.12kWh LiFePO4 battery in one wall unit.",
    ["5 kW inverter", "5.12 kWh battery", "All-in-one"], stock="low_stock", qty=1)
add(SOLARGEN, "inverters", "all-in-one-ess", "Maqbul",
    "Maqbul All-in-One 5kW with 10.24kWh Storage", "MQB-AIO-5-10", 340000.00, None,
    "Integrated 5kW hybrid inverter with 10.24kWh of LiFePO4 storage.",
    ["5 kW inverter", "10.24 kWh battery", "All-in-one"], stock="low_stock", qty=1)
add(SOLARGEN, "inverters", "all-in-one-ess", "Maqbul",
    "Maqbul 1.2kW Solar Kit with 2kWh LiFePO4 Storage", "MQB-KIT-1.2", 50000.00, None,
    "Entry solar kit: 1.2kW inverter, 2kWh lithium storage and accessories, solar-ready.",
    ["1.2 kW", "2 kWh", "Kit with accessories"], stock="in_stock", qty=134)
add(SOLARGEN, "inverters", "all-in-one-ess", "Maqbul",
    "Maqbul 3kW Solar Kit with 4kWh LiFePO4 Storage", "MQB-KIT-3", 90000.00, None,
    "3kW solar kit with 4kWh lithium storage and accessories for lights, TV and fridge loads.",
    ["3 kW", "4 kWh", "Kit with accessories"], stock="in_stock", qty=59)

# --- Jinko inverters ---
for name, model, cost, qty, ph, kw in [
    ("Jinko 5kW Single-Phase Hybrid Inverter", "JKS-H5-1P", 130000.00, 18, 1, 5),
    ("Jinko 8kW Single-Phase Hybrid Inverter", "JKS-H8-1P", 200000.00, 1, 1, 8),
    ("Jinko 8kW Three-Phase Hybrid Inverter", "JKS-H8-3P", 240000.00, 2, 3, 8),
    ("Jinko 10kW Three-Phase Hybrid Inverter", "JKS-H10-3P", 250000.00, 4, 3, 10),
    ("Jinko 12kW Three-Phase Hybrid Inverter", "JKS-H12-3P", 270000.00, 9, 3, 12),
]:
    st, q = sg_stock(qty)
    add(SOLARGEN, "inverters", "hybrid", "Jinko Solar", name, model, cost, None,
        f"{kw}kW {'single' if ph == 1 else 'three'}-phase hybrid inverter for grid-plus-battery systems.",
        [f"{kw} kW", f"{'Single' if ph == 1 else 'Three'} phase", "Hybrid"], stock=st, qty=q)

# --- Solis inverters ---
solis = [
    ("Solis S6-EO 1P 48V 5kW Off-Grid Inverter", "S6-EO1P5K-48", "off-grid", 50000.00, 16, 0, "5 kW", "48 V", "Single phase"),
    ("Solis S6-EH 1P LV 5kW Hybrid Inverter", "S6-EH1P5K-L", "hybrid", 100000.00, 0, 20, "5 kW", "48 V LV", "Single phase"),
    ("Solis S6-EH 1P LV 8kW Hybrid Inverter", "S6-EH1P8K-L", "hybrid", 140000.00, 0, 20, "8 kW", "48 V LV", "Single phase"),
    ("Solis S6-EH 1P LV 10kW Hybrid Inverter", "S6-EH1P10K-L", "hybrid", 170000.00, 11, 20, "10 kW", "48 V LV", "Single phase"),
    ("Solis S6-EH 1P LV 12kW Hybrid Inverter", "S6-EH1P12K-L", "hybrid", 230000.00, 0, 20, "12 kW", "48 V LV", "Single phase"),
    ("Solis S6-EH 1P LV 16kW Hybrid Inverter", "S6-EH1P16K-L", "hybrid", 290000.00, 11, 20, "16 kW", "48 V LV", "Single phase"),
    ("Solis S6-EH 3P LV 10kW Hybrid Inverter", "S6-EH3P10K-L", "hybrid", 235000.00, 0, 20, "10 kW", "LV battery", "Three phase"),
    ("Solis S6-EH 3P LV 12kW Hybrid Inverter", "S6-EH3P12K-L", "hybrid", 245000.00, 0, 20, "12 kW", "LV battery", "Three phase"),
    ("Solis S6-EH 3P LV 15kW Hybrid Inverter", "S6-EH3P15K-L", "hybrid", 265000.00, 0, 20, "15 kW", "LV battery", "Three phase"),
    ("Solis S6-EH 3P HV 10kW Hybrid Inverter", "S6-EH3P10K-H", "hybrid", 170000.00, 4, 0, "10 kW", "HV battery", "Three phase"),
    ("Solis S6-EH 3P HV 15kW Hybrid Inverter", "S6-EH3P15K-H", "hybrid", 205000.00, 9, 5, "15 kW", "HV battery", "Three phase"),
    ("Solis S6-EH 3P HV 20kW Hybrid Inverter", "S6-EH3P20K-H", "hybrid", 245000.00, 0, 10, "20 kW", "HV battery", "Three phase"),
    ("Solis S6-EH 3P HV 30kW Hybrid Inverter", "S6-EH3P30K-H", "hybrid", 460000.00, 9, 10, "30 kW", "HV battery", "Three phase"),
    ("Solis S6-EH 3P HV 50kW Hybrid Inverter", "S6-EH3P50K-H", "hybrid", 590000.00, 0, 10, "50 kW", "HV battery", "Three phase"),
    ("Solis S6 3P 50kW Grid-Tied Inverter", "S6-GT3P50K", "grid-tied", 255000.00, 4, 5, "50 kW", "Grid-tied", "Three phase"),
    ("Solis S6 3P 100kW Grid-Tied Inverter", "S6-GT3P100K", "grid-tied", 502667.75, 3, 0, "100 kW", "Grid-tied", "Three phase"),
]
for name, model, sub, cost, avail, exp, *ks in solis:
    st, q = sg_stock(avail, exp)
    kind = {"hybrid": "hybrid", "off-grid": "off-grid", "grid-tied": "grid-tied"}[sub]
    add(SOLARGEN, "inverters", sub, "Solis", name, model, cost, None,
        f"{ks[0]} {ks[2].lower()} {kind} inverter from the Solis S6 series.",
        ks, stock=st, qty=q,
        featured=(model == "S6-EH1P5K-L"))

# --- Victron charge controllers (single "Offer Price" column — basis unconfirmed) ---
for name, model, cost, qty in [
    ("Victron BlueSolar MPPT 150/45-Tr Charge Controller", "SCC010045200", 38033.49, 5),
    ("Victron SmartSolar MPPT 250/100-Tr Charge Controller", "SCC125110210", 146109.60, 2),
    ("Victron SmartSolar MPPT 150/70-Tr Charge Controller", "SCC115070210", 76244.69, 1),
    ("Victron SmartSolar MPPT 150/85-Tr Charge Controller", "SCC115085210", 98132.58, 1),
    ("Victron BlueSolar MPPT 150/60-Tr Charge Controller", "SCC010060200", 42259.43, 2),
]:
    st, q = sg_stock(qty)
    mppt = name.split("MPPT ")[1].split("-Tr")[0]
    add(SOLARGEN, "inverters", "charge-controllers", "Victron Energy", name, model, cost, None,
        f"MPPT {mppt} solar charge controller — {mppt.split('/')[0]}V max PV input, {mppt.split('/')[1]}A charge current.",
        [f"MPPT {mppt}", f"{mppt.split('/')[0]} V max PV", f"{mppt.split('/')[1]} A"],
        stock=st, qty=q, installs=False, status="needs_review",
        pricing_note="Single 'Offer Price' column on source list — cost basis unconfirmed; confirm with Solargen before publishing a retail price.")

# --- Water treatment ---
add(SOLARGEN, "water-treatment", "reverse-osmosis", "Hanti",
    "Hanti ARO2A 7-Stage Undersink Reverse Osmosis System", "ARO2A", 23000.00, None,
    "Seven-stage undersink reverse-osmosis system for household drinking water.",
    ["7-stage RO", "Undersink"], stock="in_stock", qty=5)
add(SOLARGEN, "water-treatment", "reverse-osmosis", "Hanti",
    "Hanti ARO4A 3-Stage Undersink Reverse Osmosis System", "ARO4A", 15000.00, None,
    "Three-stage undersink reverse-osmosis system for household drinking water.",
    ["3-stage RO", "Undersink"], stock="in_stock", qty=5)

# --- Pumps: Shiyuan ---
add(SOLARGEN, "irrigation-pumps", "surface", "Shiyuan",
    'Shiyuan SY-80 3" Surface Solar Pump, 15m Head', "SY-80", 25200.00, None,
    "Three-inch surface solar pump lifting to 15 metres, for shallow water sources.",
    ['3" outlet', "15 m head", "Surface"], stock="in_stock", qty=15)
add(SOLARGEN, "irrigation-pumps", "surface", "Shiyuan",
    'Shiyuan SYBL-2200-4 4" Surface Solar Pump, 16m Head', "SYBL-2200-4", 21600.00, None,
    "Four-inch surface solar pump lifting to 16 metres for irrigation from rivers and tanks.",
    ['4" outlet', "16 m head", "Surface"], stock="in_stock", qty=28)
add(SOLARGEN, "irrigation-pumps", "submersible", "Shiyuan",
    'Shiyuan 3AC/DC 6.5 1" Submersible AC/DC Pump, 160m Head', "3ACDC-6.5", 47560.00, None,
    "One-inch AC/DC submersible borehole pump lifting from up to 160 metres.",
    ['1" outlet', "160 m head", "AC/DC"], stock="low_stock", qty=3)

# --- Pumps: Hanti units ---
for cat, name, model, cost, qty, ks in [
    ("submersible", "Hanti SPB45K5070-4 Submersible Pump Unit, 5.5kW Motor", "SPB45K5070-4", 179452.03, 2, ["5.5 kW motor", "Submersible"]),
    ("submersible", "Hanti SPB45K5070-4.5 Submersible Pump Unit, 7.5kW Motor", "SPB45K5070-4.5", 259374.27, 3, ["7.5 kW motor", "Submersible"]),
    ("submersible", "Hanti SPB611K260-4.5 Submersible Pump Unit, 11kW Motor", "SPB611K260-4.5", 369959.83, 4, ["11 kW motor", "Submersible"]),
    ("surface", "Hanti SPS44K0500-4 Surface Pump, 4kW", "SPS44K0500-4", 145138.76, 1, ["4 kW", "Surface"]),
    ("surface", "Hanti SPS55K51000-4 Surface Pump, 5.5kW", "SPS55K51000-4", 166238.23, 2, ["5.5 kW", "Surface"]),
    ("surface", "Hanti SPS57K51000-4 Surface Pump, 7.5kW", "SPS57K51000-4", 263423.65, 2, ["7.5 kW", "Surface"]),
]:
    st, q = sg_stock(qty)
    add(SOLARGEN, "irrigation-pumps", cat, "Hanti", name, model, cost, None,
        f"{ks[0]} solar {cat} pump unit for borehole and irrigation duty.", ks, stock=st, qty=q)

# --- Pumps: Hanti hybrid pump controllers ---
for name, model, cost, qty, kw in [
    ("Hanti PB5500H-G3 5.5kW Hybrid Pump Controller", "PB5500H-G3", 94988.02, 7, 5.5),
    ("Hanti PB7500H-G3 7.5kW Hybrid Pump Controller", "PB7500H-G3", 110237.56, 8, 7.5),
    ("Hanti PB11KH-G3 11kW Hybrid Pump Controller", "PB11KH-G3", 152862.74, 17, 11),
]:
    st, q = sg_stock(qty)
    add(SOLARGEN, "irrigation-pumps", "controllers-drives", "Hanti", name, model, cost, None,
        f"{kw}kW hybrid controller running a pump from solar with mains or generator assist.",
        [f"{kw} kW", "Hybrid solar/AC"], stock=st, qty=q)

# --- Pumps: Hanti Hober ---
for name, model, cost, qty, ks in [
    ("Hanti HBP4C-110-1500 DC Brushless Submersible Pump, 135m Head", "HBP4C-110-1500-6", 24940.00, 32, ["135 m head", "DC brushless"]),
    ("Hanti HSP3000-BF Submersible Solar Pump, 380V 3kW 3PH", "HSP3000-BF", 48720.00, 2, ["3 kW", "380 V", "Three phase"]),
    ("Hanti HSP5500-VC Submersible Solar Pump, 380V 5.5kW 3PH", "HSP5500-VC", 59160.00, 2, ["5.5 kW", "380 V", "Three phase"]),
    ("Hanti HSP11K-BS Submersible Solar Pump, 380V 11kW 3PH", "HSP11K-BS", 88936.05, 1, ["11 kW", "380 V", "Three phase"]),
    ("Hanti HSP15K-BS Submersible Solar Pump, 380V 15kW 3PH", "HSP15K-BS", 106720.00, 3, ["15 kW", "380 V", "Three phase"]),
]:
    st, q = sg_stock(qty)
    add(SOLARGEN, "irrigation-pumps", "submersible", "Hanti", name, model, cost, None,
        f"{ks[0]} submersible solar borehole pump.", ks, stock=st, qty=q)

# --- Pump inverters / controllers ---
for name, model, cost, qty, ks in [
    ("Hanti HBP4C-110-1500F Single-Phase DC Pump Controller", "HBP4C-110-1500F", 39230.00, 32, ["DC pump control", "Single phase"]),
    ("Hanti HSPH2200L 2.2kW Single-Phase Solar Pump Inverter", "HSPH2200L", 62459.10, 4, ["2.2 kW", "Single phase"]),
    ("Hanti HSPH3700H 3.7kW Solar Pump Inverter", "HSPH3700H", 70478.00, 5, ["3.7 kW"]),
    ("Hanti HSPH5500H 5.5kW Solar Pump Inverter", "HSPH5500H", 86138.91, 1, ["5.5 kW"]),
]:
    st, q = sg_stock(qty)
    add(SOLARGEN, "irrigation-pumps", "controllers-drives", "Hanti", name, model, cost, None,
        f"Solar pump inverter — {ks[0]} drive for solar-direct pumping.", ks, stock=st, qty=q)

# --- Pump accessories ---
for name, model, cost, qty, ks, inst in [
    ("Float Switch", "FLOAT-SW", 773.44, 27, ["Level control"], False),
    ("PV Circuit Breaker 1000V 63A 4P", "PVCB-1000-63-4P", 4756.00, 2, ["1000 V", "63 A", "4-pole"], False),
    ("Water Level Switch S-EL-B-01", "S-EL-B-01", 1469.83, 100, ["Level control"], False),
    ("Isolator Switch 1000V 32A", "ISO-1000-32", 5104.00, 5, ["1000 V", "32 A"], False),
]:
    st, q = sg_stock(qty)
    add(SOLARGEN, "irrigation-pumps", "accessories", "Hanti", name, model, cost, None,
        f"Pump system accessory — {name.lower()}.", ks, stock=st, qty=q, installs=inst)

# --- Lorentz (single "Offer Price" column — basis unconfirmed) ---
LZ_NOTE = "Single 'Offer Price' column on source list — cost basis unconfirmed; confirm with Solargen before publishing a retail price."
for sub, name, model, cost, qty, ks, pub in [
    ("submersible", "Lorentz PU150 C-SJ5-4 Pump Unit, RP 1 1/2 UL", "PU150-C-SJ5-4", 63079.08, 3, ["Submersible", 'RP 1 1/2"'], True),
    ("submersible", "Lorentz PU7K C-SJ12-15 Pump Unit, RP 6", "PU7K-C-SJ12-15", 200993.23, 5, ["Submersible", 'RP 6"'], True),
    ("spares", "Lorentz Pump End C-SJ5-4, RP 1 1/2", "PE-C-SJ5-4", 43104.79, 3, ["Pump end"], False),
    ("spares", "Lorentz Pump End C-SJ5-8, RP 1 1/2", "PE-C-SJ5-8", 45916.35, 2, ["Pump end"], False),
    ("spares", "Lorentz Pump End C-SJ3-18, RP 1 1/4", "PE-C-SJ3-18", 40406.46, 1, ["Pump end"], False),
    ("spares", "Lorentz Pump End C-SJ8-7, RP 2", "PE-C-SJ8-7", 40406.46, 1, ["Pump end"], False),
    ("spares", "Lorentz Pump End C-SJ8-15, RP 2", "PE-C-SJ8-15", 68406.07, 2, ["Pump end"], False),
    ("spares", "Lorentz Pump End C-SJ17-7, RP 2 1/4", "PE-C-SJ17-7", 116948.19, 1, ["Pump end"], False),
    ("spares", "Lorentz Pump End C-SJ17-11, RP 2 1/2", "PE-C-SJ17-11", 118192.49, 1, ["Pump end"], False),
    ("spares", "Lorentz Pump End C-SJ17-18, RP 2 1/2", "PE-C-SJ17-18", 157175.27, 1, ["Pump end"], False),
    ("spares", "Lorentz Pump End C-SJ8-37, RP 2", "PE-C-SJ8-37", 136854.46, 2, ["Pump end"], False),
    ("controllers-drives", "Lorentz EC Drive 150-C, 0.3kW", "ECD-150-C", 53400.80, 3, ["0.3 kW", "EC drive"], True),
    ("controllers-drives", "Lorentz EC Drive 200-C, 0.3kW", "ECD-200-C", 55812.45, 1, ["0.3 kW", "EC drive"], True),
    ("controllers-drives", "Lorentz EC Drive 200-HR, 0.3kW", "ECD-200-HR", 50601.21, 3, ["0.3 kW", "EC drive"], True),
    ("controllers-drives", 'Lorentz AC Drive Sub 4" 4kW', "ACD-S4-4K", 75003.47, 1, ["4 kW", "AC drive"], True),
    ("controllers-drives", 'Lorentz AC Drive Sub 4" 5.5kW', "ACD-S4-5.5K", 115704.23, 2, ["5.5 kW", "AC drive"], True),
    ("controllers-drives", 'Lorentz AC Drive Sub 6" 5.5kW', "ACD-S6-5.5K", 115091.87, 1, ["5.5 kW", "AC drive"], True),
    ("controllers-drives", 'Lorentz AC Drive Sub 6" 11kW', "ACD-S6-11K", 149295.78, 1, ["11 kW", "AC drive"], True),
    ("controllers-drives", "Lorentz PS2-150 Pump Controller, 0.3kVA", "PS2-150", 34508.70, 5, ["0.3 kVA"], True),
    ("controllers-drives", "Lorentz PS2-200 Pump Controller, 0.3kVA", "PS2-200", 34508.70, 3, ["0.3 kVA"], True),
    ("controllers-drives", "Lorentz PSk2-7 Pump Controller, 5.5kVA-D", "PSK2-7-C", 161603.49, 3, ["5.5 kVA"], True),
    ("spares", "Lorentz PSK2-7 Mainboard", "PSK2-7-MB", 16843.02, 2, ["Mainboard"], False),
    ("spares", "Lorentz PSK2-9 Mainboard", "PSK2-9-MB", 19650.18, 3, ["Mainboard"], False),
    ("spares", "Lorentz PSK2-21 Mainboard", "PSK2-21-MB", 25264.51, 3, ["Mainboard"], False),
    ("spares", "Lorentz PSK2-25 Mainboard", "PSK2-25-MB", 34808.89, 3, ["Mainboard"], False),
    ("accessories", "Lorentz Powerpack 150", "PWRPK-150", 29260.01, 2, ["Power pack"], True),
    ("accessories", "Lorentz MNSPD-115 Surge Protector", "MNSPD-115", 19149.40, 2, ["115 V SPD"], True),
    ("accessories", "Lorentz MNSPD-600 Surge Protector", "MNSPD-600", 22218.57, 8, ["600 V SPD"], True),
    ("accessories", "Lorentz Well Probe Sensor V2", "WELLPROBE-V2", 5751.07, 139, ["Well probe"], True),
    ("accessories", "Lorentz Water Sensor, Pipe Installation", "WATERSENSOR", 17633.22, 17, ["Pipe sensor"], True),
    ("accessories", "Lorentz Liquid Pressure Sensor LPS-500", "LPS-500", 24018.96, 1, ["Pressure sensor"], True),
    ("accessories", "Lorentz PS Communicator 3G with Global SIM", "PS-COMM-3G", 45988.24, 7, ["3G telemetry"], True),
    ("accessories", "Lorentz External Antenna", "ANT-EXT", 4125.01, 6, ["Antenna"], False),
    ("accessories", "Lorentz LC20-12M PV Module Pre-Wired Fixture", "LC20-12M", 7873.04, 13, ["Pre-wired fixture"], False),
]:
    st, q = sg_stock(qty)
    add(SOLARGEN, "irrigation-pumps", sub, "Lorentz", name, model, cost, None,
        f"Lorentz solar pumping component — {name.replace('Lorentz ', '').lower()}.",
        ks, stock=st, qty=q, published=pub, status="needs_review", pricing_note=LZ_NOTE,
        installs=(sub not in ("accessories", "spares")))

# --- Balance of system (Solargen) ---
for name, model, cost, qty, exp, ks in [
    ("2-Pole PV/DC Breaker 16A", "ZB-DC-16A", 1972.00, 206, 0, ["16 A", "2-pole", "DC"]),
    ("2-Pole PV/DC Breaker 63A", "ZB-DC-63A", 2320.00, 203, 0, ["63 A", "2-pole", "DC"]),
    ("2-Pole PV/DC Breaker 80A", "ZB-DC-80A", 9280.00, 41, 0, ["80 A", "2-pole", "DC"]),
    ("2-Pole PV/DC Breaker 125A", "ZB-DC-125A", 9280.00, 148, 0, ["125 A", "2-pole", "DC"]),
    ("2-Pole PV/DC Breaker 200A", "ZB-DC-200A", 9280.00, 107, 0, ["200 A", "2-pole", "DC"]),
    ("2-Pole PV/DC Breaker 250A", "ZB-DC-250A", 9280.00, 29, 0, ["250 A", "2-pole", "DC"]),
    ("ZB Surge Protection Device 600V 2P", "ZB-SPD-600", 2552.00, 5, 0, ["600 V", "2-pole", "SPD"]),
    ("ZB Surge Protection Device 1000V 2P", "ZB-SPD-1000", 2900.00, 0, 100, ["1000 V", "2-pole", "SPD"]),
    ("18-Way Distribution Board with AC/DC SPD and PV Breaker, 250A", "DB18-250", 10440.00, 32, 0, ["18-way", "250 A", "AC+DC SPD"]),
    ("3-Way Breaker Box", "BB-3W", 2204.00, 136, 0, ["3-way"]),
    ("6-Way Breaker Box", "BB-6W", 2784.01, 44, 0, ["6-way"]),
    ("13-Way Breaker Box", "BB-13W", 2784.01, 14, 0, ["13-way"]),
    ("Y-Branch Connectors (Pair)", "Y-CONN", 580.00, 474, 0, ["Pair", "Y-branch"]),
    ("Jinko MC4 Connectors (Pair)", "MC4-JINKO", 580.00, 830, 0, ["Pair", "MC4"]),
    ("MC4 Connectors (Pair)", "MC4-STD", 348.00, 434, 0, ["Pair", "MC4"]),
    ("DC Solar PV Cable 4mm, Black/Red (Per Metre)", "PVC-4MM", 139.20, 0, 10000, ["4 mm²", "Per metre"]),
    ("DC Solar PV Cable 6mm, Red/Black (Per Metre)", "PVC-6MM", 150.80, 50000, 0, ["6 mm²", "Per metre"]),
    ("Aluminium Mounting Rail 4700mm", "RAIL-4700", 2900.00, 142, 1000, ["4.7 m", "Aluminium"]),
    ("Rail Mid Clamp", "RAIL-MID", 116.00, 10, 0, ["Mid clamp"]),
    ("Rail End Clamp", "RAIL-END", 116.00, 848, 0, ["End clamp"]),
    ("Rail L-Foot, Long", "RAIL-LFOOT-L", 348.00, 282, 0, ["L-foot"]),
    ("Rail L-Foot, Short", "RAIL-LFOOT-S", 185.60, 0, 3000, ["L-foot"]),
    ("Roof Tile Hooks", "TILE-HOOK", 611.32, 208, 0, ["Tile hook"]),
    ("Rail Splice Kit", "RAIL-SPLICE", 197.20, 203, 0, ["Splice kit"]),
    ("Earthing Lug", "EARTH-LUG", 83.52, 41, 0, ["Earthing"]),
    ("Earthing Clip", "EARTH-CLIP", 23.20, 390, 0, ["Earthing"]),
]:
    st, q = sg_stock(qty, exp)
    sub = "mounting-rails" if ("Rail" in name or "Hook" in name or "Earthing" in name) else \
          ("cables-connectors" if ("Cable" in name or "Connector" in name) else "protection")
    cat = "solar-panels" if sub == "mounting-rails" else "balance-of-system"
    add(SOLARGEN, cat, sub, "Solargen", name, model, cost, None,
        f"Balance-of-system component — {name.lower()}.", ks, stock=st, qty=q, installs=False)

# =====================================================================
# LIVOLTEK / HEXING — dealer (L2) column where present, VAT-exclusive
# =====================================================================

# --- All-in-one ESS ---
p_hyper = add(LIVOLTEK, "inverters", "all-in-one-ess", "Livoltek",
    "Livoltek Hyper 5000 All-in-One ESS — 5kW Hybrid Inverter + 5.12kWh LiFePO4", "HYPER-5000R31003",
    195000.00, 5,
    "5kW IP65 hybrid inverter with twin MPPTs, Wi-Fi and a 5.12kWh LiFePO4 battery in a single stack.",
    ["5 kW hybrid", "5.12 kWh LiFePO4", "2 MPPT", "IP65"], featured=True)
add(LIVOLTEK, "inverters", "all-in-one-ess", "Livoltek",
    "Livoltek Hyper 5000 All-in-One ESS (R31005 Variant)", "HYPER-5000R31005",
    203000.00, 5,
    "5kW all-in-one energy storage system, R31005 inverter variant, with 5.12kWh LiFePO4 battery.",
    ["5 kW hybrid", "5.12 kWh LiFePO4", "2 MPPT", "IP65"])
add(LIVOLTEK, "inverters", "all-in-one-ess", "Livoltek",
    "Livoltek Hyper 6000 All-in-One ESS with 5.12kWh LiFePO4", "HYPER-6000R11001",
    219000.00, 5,
    "Hyper 6000 all-in-one energy storage system with a 5.12kWh LiFePO4 battery.",
    ["Hyper 6000", "5.12 kWh LiFePO4", "2 MPPT", "IP65"],
    status="needs_review",
    pricing_note="Source list describes the Hyper 6000 as '5 KW' — power rating needs confirmation with Hexing before publish.")

# --- Off-grid inverters ---
for name, model, cost, w, ks, pub, note in [
    ("Livoltek 3kW 24V Low-Frequency Off-Grid Inverter", "GF1-3K24S1", 32000.00, 2, ["3 kW", "24 V", "Low frequency"], True, None),
    ("Livoltek 3kW 24V High-Frequency Off-Grid Inverter", "GF1-3K24S1R11001", None, 2, ["3 kW", "24 V", "High frequency"], False, "No price on source list — call for pricing."),
    ("Livoltek 3.5kW 24V High-Frequency Off-Grid Inverter", "GF1-3K524S2", 33500.00, 2, ["3.5 kW", "24 V", "High frequency"], True, None),
    ("Livoltek 6.2kW 48V High-Frequency Off-Grid Inverter", "GF1-6K248S3", 45000.00, 2, ["6.2 kW", "48 V", "High frequency"], True, None),
    ("Livoltek 6kW 48V Off-Grid Inverter with AFCI and Wi-Fi", "GF1-6KS2R11002", 86000.00, 4, ["6 kW", "48 V", "AFCI", "Wi-Fi"], True, None),
    ("Livoltek 8kW 48V Off-Grid Inverter with AFCI and Wi-Fi", "GF1-8KS2-T", 125000.00, 4, ["8 kW", "48 V", "AFCI", "Wi-Fi"], True, None),
    ("Livoltek 12kW 48V Off-Grid Inverter with AFCI and Wi-Fi", "GF1-12KS2-T", 150000.00, 4, ["12 kW", "48 V", "AFCI", "Wi-Fi"], True, None),
]:
    add(LIVOLTEK, "inverters", "off-grid", "Livoltek", name, model, cost, w,
        f"{ks[0]} {ks[1]} off-grid inverter with built-in MPPT solar charging.",
        ks, published=pub, status=("needs_review" if note else None), pricing_note=note)

# --- Grid-tied three-phase ---
for name, model, cost, ks in [
    ("Livoltek 10kW Three-Phase Grid-Tied Inverter, 380V", "GT3-10KD1R11006", 82000.00, ["10 kW", "380 V", "Three phase", "Wi-Fi + AFCI"]),
    ("Livoltek 15kW Three-Phase Grid-Tied Inverter, 380V", "GT3-15KD1R11006", 97500.00, ["15 kW", "380 V", "Three phase", "Wi-Fi + AFCI"]),
    ("Livoltek 20kW Three-Phase Grid-Tied Inverter, 380V", "GT3-20KD1R11006", 115000.00, ["20 kW", "380 V", "Three phase", "Wi-Fi + AFCI"]),
    ("Livoltek 25kW Three-Phase Grid-Tied Inverter, 380V", "GT3-25KD1R11006", 130000.00, ["25 kW", "380 V", "Three phase", "Wi-Fi + AFCI"]),
    ("Livoltek 30kW Three-Phase Grid-Tied Inverter, 380V, 2 MPPT", "GT3-30K-D2R11006", 162500.00, ["30 kW", "380 V", "2 MPPT", "Wi-Fi"]),
    ("Livoltek 50kW Three-Phase Grid-Tied Inverter, 380V, 3 MPPT", "GT3-50K-T2R11001", 265000.00, ["50 kW", "380 V", "3 MPPT", "Wi-Fi"]),
    ("Livoltek 60kW Three-Phase Grid-Tied Inverter, 380V, 4 MPPT", "GT3-60K-Q2R11001", 275000.00, ["60 kW", "380 V", "4 MPPT", "Wi-Fi"]),
]:
    add(LIVOLTEK, "inverters", "grid-tied", "Livoltek", name, model, cost, 5,
        f"{ks[0]} three-phase grid-tied inverter for net-metered and self-consumption sites.", ks)
add(LIVOLTEK, "inverters", "grid-tied", "Livoltek",
    "Livoltek GT3-125K Three-Phase Grid-Tied Inverter, 10 MPPT", "GT3-125K-11R11002",
    520000.00, 5,
    "Large three-phase grid-tied inverter with ten MPPTs for commercial arrays.",
    ["10 MPPT", "380/400/415 V", "Three phase"],
    published=False, status="needs_review",
    pricing_note="Source list states '12kW' against a GT3-125K model code — rating contradiction; confirm with Hexing before publishing.")

# --- Single-phase hybrid ---
for name, model, cost, ks in [
    ("Livoltek 6kW Single-Phase Hybrid Inverter, 48V", "HP1-6KS2R11002", 110000.00, ["6 kW", "48 V", "Wi-Fi + CT"]),
    ("Livoltek 8kW Single-Phase Hybrid Inverter, 48V", "HP1-8KS2MR11002", 148000.00, ["8 kW", "48 V", "Wi-Fi + CT"]),
    ("Livoltek 12kW Single-Phase Hybrid Inverter, 48V", "HP1-12KS2R11002", 220000.00, ["12 kW", "48 V", "Wi-Fi + CT"]),
]:
    add(LIVOLTEK, "inverters", "hybrid", "Livoltek", name, model, cost, 4,
        f"{ks[0]} single-phase hybrid inverter running solar, battery and grid together.", ks)

# --- Three-phase hybrid ---
for name, model, cost, ks, pub, note in [
    ("Livoltek 10kW Three-Phase Hybrid Inverter, IP65", "HP3-10KD1W00101", 210000.00, ["10 kW", "2 MPPT", "380 V", "IP65"], True, None),
    ("Livoltek 15kW Three-Phase Hybrid Inverter, IP65", "HP3-15KD1W00101", 275000.00, ["15 kW", "2 MPPT", "380 V", "IP65"], True, None),
    ("Livoltek 15kW Three-Phase Hybrid Inverter WL, with Smart Meter", "HP3-15KT2R11001", 245000.00, ["15 kW", "380 V", "Smart meter", "AFCI"], True, None),
    ("Livoltek 20kW Three-Phase Hybrid Inverter WL, with Smart Meter", "HP3-20KT2R11001", 267000.00, ["20 kW", "380 V", "Smart meter", "AFCI"], True, None),
    ("Livoltek 25kW Three-Phase Hybrid Inverter WL, with Smart Meter", "HP3-25KT2R11001", 276000.00, ["25 kW", "380 V", "Smart meter", "AFCI"], True, None),
    ("Livoltek 30kW Three-Phase Hybrid Inverter WL, with Smart Meter", "HP3-30KT2R11002", 345000.00, ["30 kW", "380 V", "Smart meter", "AFCI"], True, None),
    ("Livoltek 6kW Three-Phase Hybrid Inverter WL (Unconfirmed Listing)", "HP3-6K-WL", 345000.00, ["6 kW", "380 V"], False,
     "Price equals the 30kW model and the printed model code duplicates the single-phase 6kW — listing looks erroneous; confirm with Hexing."),
    ("Livoltek 6kW Off-Grid Inverter WL (Unconfirmed Listing)", "GF1-6K-WL", 345000.00, ["6 kW", "380 V"], False,
     "Price equals the 30kW hybrid and the model code duplicates the 48V off-grid 6kW — listing looks erroneous; confirm with Hexing."),
    ("Livoltek 125kW Grid-Tied Inverter WL (Unconfirmed Listing)", "GT3-125K1R11002", 345000.00, ["125 kW", "380 V"], False,
     "Price contradicts the GT3-125K line elsewhere on the same list — confirm with Hexing."),
]:
    add(LIVOLTEK, "inverters", "hybrid", "Livoltek", name, model, cost, 5,
        f"{ks[0]} three-phase hybrid inverter.", ks,
        published=pub, status=("needs_review" if note else None), pricing_note=note)

# --- LV batteries ---
add(LIVOLTEK, "battery-storage", "12v-24v", "Livoltek",
    "Livoltek LV LiFePO4 Battery 1.2kWh, 12V 100Ah", "BLF-12100R21001", 22500.00, 5,
    "Compact 12V 100Ah LiFePO4 battery for small backup and lighting systems.",
    ["1.2 kWh", "12 V", "100 Ah", "IP54"], installs=False)
add(LIVOLTEK, "battery-storage", "12v-24v", "Livoltek",
    "Livoltek LV LiFePO4 Battery 2.4kWh, 24V 100Ah", "BLF-24100R11001", 41000.00, 5,
    "24V 100Ah LiFePO4 battery for mid-size backup systems.",
    ["2.4 kWh", "24 V", "100 Ah", "IP54"], installs=False)
p_blf51 = add(LIVOLTEK, "battery-storage", "wall-mounted-lv", "Livoltek",
    "Livoltek LV LiFePO4 Battery 5.12kWh, 51.2V 100Ah", "BLF-B51100R21001", 90500.00, 5,
    "5.12kWh 51.2V LiFePO4 battery with EVE cells, stackable up to five units.",
    ["5.12 kWh", "51.2 V", "100 Ah", "Stackable ×5"], featured=True)

# --- HV residential stacks ---
for kwh, model, cost in [(10, "BHF-S10R11001", 333500.00), (15, "BHF-S15R11001", 471500.00),
                         (20, "BHF-S20R11001", 609500.00), (25, "BHF-S25R11001", 772800.00),
                         (30, "BHF-S30R11001", 908500.00)]:
    add(LIVOLTEK, "battery-storage", "high-voltage", "Livoltek",
        f"Livoltek Residential High-Voltage LiFePO4 Battery Stack, {kwh}kWh", model, cost, 5,
        f"{kwh}kWh residential high-voltage LiFePO4 stack built from 102.4V 50Ah IP65 modules.",
        [f"{kwh} kWh", "High voltage", "IP65", "LiFePO4"])
add(LIVOLTEK, "battery-storage", "high-voltage", "Livoltek",
    "Livoltek High-Voltage Control Box with Base", "BHF-C01GTR11001", 92000.00, 5,
    "Control box and base for Livoltek residential high-voltage battery stacks.",
    ["HV control box"], )
add(LIVOLTEK, "battery-storage", "high-voltage", "Livoltek",
    "Livoltek Tandem Transfer Kit with Base", "BHF-T01R11001", 23000.00, 5,
    "Tandem transfer kit for extending Livoltek high-voltage battery stacks.",
    ["Stack extension"])

# --- HV G-series ---
for kwh, volts, model, cost in [(20, "307.2", "BHF-G20.R110", 500000.00), (25, "307.2", "BHF-G25.R110", 602000.00),
                                (30, "307.2", "BHF-G30.R110", 706000.00), (35, "358.4", "BHF-G35.R110", 808000.00),
                                (40, "409.6", "BHF-G40.R110", 910000.00), (45, "460.8", "BHF-G45.R110", 1012000.00),
                                (50, "512.0", "BHF-G50.R110", 1116000.00), (55, "563.2", "BHF-G55.R110", 1220000.00),
                                (60, "614.4", "BHF-G60.R110", 1322000.00)]:
    add(LIVOLTEK, "battery-storage", "high-voltage", "Livoltek",
        f"Livoltek HV LiFePO4 Battery {kwh}kWh, {volts}V 100Ah", model, cost, 5,
        f"{kwh}kWh high-voltage LiFePO4 battery bank at {volts}V for three-phase hybrid systems.",
        [f"{kwh} kWh", f"{volts} V", "100 Ah", "IP20"])
add(LIVOLTEK, "battery-storage", "high-voltage", "Livoltek",
    "Livoltek HV G-Series Control Box", "BHF-C01YDR12001", 83000.00, None,
    "Control box for Livoltek G-series high-voltage battery banks.", ["HV control box"])
add(LIVOLTEK, "battery-storage", "high-voltage", "Livoltek",
    "Livoltek HV Battery Mounting Rack", "BHF-R01R11001", 52000.00, None,
    "Floor-standing mounting rack for Livoltek G-series high-voltage batteries.", ["Mounting rack"])

# --- C&I cabinets (request-a-quote tier) ---
add(LIVOLTEK, "battery-storage", "ci-cabinets", "Livoltek",
    "Livoltek C&I Battery Cabinet 261kWh, IP55 (Battery Only)", "BHF-X261DR11001", 6860000.00, 10,
    "261kWh plug-and-play commercial and industrial battery cabinet, battery only, no PCS.",
    ["261 kWh", "IP55", "C&I"])
add(LIVOLTEK, "battery-storage", "ci-cabinets", "Livoltek",
    "Livoltek C&I ESS 125kW / 261kWh, 380-400V, IP55", "BES-P125X261E-T", 7142000.00, 10,
    "Complete 125kW / 261kWh commercial energy storage system with integrated PCS.",
    ["125 kW", "261 kWh", "IP55", "C&I"])

# --- Livoltek accessories ---
add(LIVOLTEK, "balance-of-system", "protection", "Livoltek",
    "Livoltek Wi-Fi Module for Remote Monitoring", "PSD300.R310", 6000.00, None,
    "Plug-in Wi-Fi module for remote monitoring of Livoltek inverters.",
    ["Wi-Fi", "Livoltek inverters"], installs=False)
add(LIVOLTEK, "balance-of-system", "protection", "Livoltek",
    "Livoltek Three-Phase Smart Meter, Four-Wire DIN Rail", "LHE34DRR11001", 8000.00, None,
    "Four-wire DIN-rail smart meter for Livoltek three-phase hybrid inverters.",
    ["Three phase", "DIN rail"], installs=False)

# --- TW panels (per-watt pricing) ---
add(LIVOLTEK, "solar-panels", "bifacial", "TW Solar",
    "TW Solar 715W Bifacial Solar Panel", "TW-715-BF", round(715 * 17.0, 2), 12,
    "715W bifacial module for maximum generation on commercial and large residential roofs.",
    ["715 W", "Bifacial"], watts=715, cost_per_watt=17.0,
    pricing_note="Priced per watt on source list (KES 17/W dealer); module price = 715 x 17.")
add(LIVOLTEK, "solar-panels", "bifacial", "TW Solar",
    "TW Solar 610W Bifacial Solar Panel", "TW-610-BF", round(610 * 16.0, 2), 12,
    "610W bifacial module balancing yield and roof coverage.",
    ["610 W", "Bifacial"], watts=610, cost_per_watt=16.0,
    pricing_note="Priced per watt on source list (KES 16/W dealer); module price = 610 x 16.")

# --- Livoltek/Hexing BOS ---
for name, model, cost, ks, pub, note in [
    ("Hexing DC Combiner Box", "HXCB10R01002", 8000.00, ["DC", "Combiner"], True, None),
    ("Hexing AC Combiner Box", "HXDB20R01002", 7000.00, ["AC", "Combiner"], True,
     "Source list shows the same model code twice at KES 7,000 and KES 3,500 — the 7,000 line is used; confirm the 3,500 entry with Hexing."),
    ("MC4 Connectors (Pair)", "HX-MC4", 200.00, ["Pair", "MC4"], True, None),
    ("Changeover Switch, AC 230V 2P 63A", "HX-3013000470", 2400.00, ["230 V", "63 A", "2-pole"], True, None),
    ("Adjustable Voltage/Current Protector, 230VAC", "HX-3010913840", 1040.00, ["230 V AC"], True, None),
    ("Surge Protective Device, DC 600V 2P 20kA", "HX-3013200300", 1200.00, ["600 V DC", "20 kA"], True, None),
    ("Surge Protective Device, DC 1000V 2P 20kA", "HX-3013200610", 1600.00, ["1000 V DC", "20 kA"], True, None),
    ("Fuse-Disconnector, DC 1000V 20A", "HX-3013500270", 400.00, ["1000 V DC", "20 A"], True, None),
    ("DC Miniature Circuit Breaker, 600V 2P 32A", "HX-3010913830", 1120.00, ["600 V DC", "32 A"], True, None),
    ("AC Surge Protective Device, 400V 2P 20kA", "HX-3013200620", 800.00, ["400 V AC", "20 kA"], True, None),
    ("String Box Enclosure, PC, 12-Way", "HX-5110701290", 1040.00, ["12-way"], True, None),
    ("String Box Enclosure, PC, 24-Way", "HX-5110701560", 2296.00, ["24-way"], True, None),
]:
    add(LIVOLTEK, "balance-of-system", "protection", "Hexing", name, model, cost, 1,
        f"Balance-of-system component — {name.lower()}.", ks,
        published=pub, status=("needs_review" if note else None), pricing_note=note, installs=False)

for name, model, cost in [
    ("Mini Rails with 4 Bolts", "HX-8040600660", 304.00),
    ("End Clamp", "HX-8040600560", 80.00),
    ("Mid Clamp", "HX-8040600590", 80.00),
    ("C&I Long Guide Rail 5.9m", "HX-8040600870", 3600.00),
    ("End Clamp 33mm", "HX-8040600880", 100.00),
    ("End Clamp 30mm", "HX-8040600380", 100.00),
    ("Mid Clamp 30mm", "HX-8040600890", 100.00),
    ("Mid Clamp 33mm", "HX-8040600900", 100.00),
    ("Rail Joiner / Rail Splice", "HX-8040600310", 110.00),
    ("L-Feet with Screws", "HX-8040600400", 200.00),
    ("Grounding Lug EG-EN-01", "HX-8040600720", 100.00),
    ("Grounding Clip GC-01", "HX-8040600730", 20.00),
]:
    add(LIVOLTEK, "solar-panels", "mounting-rails", "Hexing", name, model, cost, 1,
        f"Panel mounting component — {name.lower()}.", ["Mounting"], installs=False)
for name, model, cost in [
    ("PV Cable 6mm Red (Per Metre)", "HX-8010301810-R", 135.00),
    ("PV Cable 6mm Black (Per Metre)", "HX-8010301810-B", 135.00),
]:
    add(LIVOLTEK, "balance-of-system", "cables-connectors", "Hexing", name, model, cost, 1,
        f"Solar DC cable — {name.lower()}.", ["6 mm²", "Per metre"], installs=False)

# --- Hexing street lights ---
for w, model, cost, tone in [(40, "8041700490", 7720.00, "N"), (60, "8041700500", 9850.00, "N"),
                             (80, "8041700510", 12250.00, "NW"), (80, "8041700520", 13700.00, "N"),
                             (100, "8041700530", 14400.00, "N")]:
    add(LIVOLTEK, "street-lights-cctv", "street-lights", "Hexing",
        f"Hexing All-in-One Solar Street Light {w}W ({tone})", f"HX-SL-{w}{tone}-{model[-3:]}",
        cost, 2,
        f"{w}W all-in-one solar street light with integrated panel, battery and {tone} LED head.",
        [f"{w} W", "All-in-one", f"{tone} tone"],
        featured=(w == 60))

# =====================================================================
# LEKKERIX — single quoted price = cost; VAT status unstated
# =====================================================================
for sub, brand, name, model, cost, w, cyc, ks, pub, note in [
    ("wall-mounted-lv", "Lithium Valley", "Lithium Valley Wall-Mounted LiFePO4 Battery 5.12kWh, 51.2V 100Ah", "LV-BAT-W5.12Ac", 88000.00, 10, ">6000", ["5.12 kWh", "51.2 V", "100 Ah"], True, None),
    ("wall-mounted-lv", "Lithium Valley", "Lithium Valley Wall-Mounted LiFePO4 Battery 10.24kWh, 51.2V 200Ah", "LV-BAT-W10.24Ac", 180000.00, 10, ">6000", ["10.24 kWh", "51.2 V", "200 Ah"], True, None),
    ("wall-mounted-lv", "Lithium Valley", "Lithium Valley W10-5A Wall-Mounted LiFePO4 Battery 10.24kWh", "W10-5A", 175000.00, 10, ">8000", ["10.24 kWh", "51.2 V", "200 Ah"], True, None),
    ("wall-mounted-lv", "Lithium Valley", "Lithium Valley W15-5A Wall-Mounted LiFePO4 Battery 14.34kWh", "W15-5A", 235000.00, 10, ">8000", ["14.34 kWh", "51.2 V", "280 Ah"], True,
     "Source lists style number as 'W16-lite' against item W15-5A — naming needs confirmation with Lekkerix."),
    ("rack-lv", "Lithium Valley", "Lithium Valley Rack-Mount LiFePO4 Battery 5.12kWh, 51.2V 100Ah", "LV-BAT-R5.12Aa", 83000.00, 10, ">6000", ["5.12 kWh", "51.2 V", "Rack mount"], True, None),
    ("12v-24v", "Lithium Valley", "Lithium Valley LFP100-12 LiFePO4 Battery 1.28kWh, 12.8V 100Ah", "LFP100-12", 18000.00, 5, ">3000", ["1.28 kWh", "12.8 V", "100 Ah"], True, None),
    ("12v-24v", "Lithium Valley", "Lithium Valley LFP200-12 LiFePO4 Battery 2.56kWh, 12.8V 200Ah", "LFP200-12", 35000.00, 5, ">3000", ["2.56 kWh", "12.8 V", "200 Ah"], True, None),
    ("12v-24v", "Lithium Valley", "Lithium Valley LiFePO4 Battery 2.56kWh, 25.6V 100Ah", "LV-25.6V100AH", 35000.00, 5, ">3000", ["2.56 kWh", "25.6 V", "100 Ah"], True, None),
    ("wall-mounted-lv", "Lekkerix", "Lekkerix Wall-Mounted LiFePO4 Battery 5.12kWh, 51.2V 100Ah", "LV-BAT-W5.12Da", 67000.00, 5, ">6000", ["5.12 kWh", "51.2 V", "100 Ah"], True, None),
    ("wall-mounted-lv", "Lekkerix", "Lekkerix Wall-Mounted LiFePO4 Battery 10.24kWh, 51.2V 200Ah", "LV-BAT-W10.24Da", 133000.00, 5, ">6000", ["10.24 kWh", "51.2 V", "200 Ah"], True, None),
    ("wall-mounted-lv", "Lekkerix", "Lekkerix Wall-Mounted LiFePO4 Battery 15.36kWh, 51.2V 300Ah", "LV-BAT-W15.36Da", 199000.00, 5, ">6000", ["15.36 kWh", "51.2 V", "300 Ah"], True, None),
    ("wall-mounted-lv", "Lithium Valley", "Lithium Valley W3-5D Wall-Mounted LiFePO4 Battery 2.56kWh, with LCD", "W3-5D", 53000.00, 5, ">6000", ["2.56 kWh", "25.6 V", "LCD display"], True, None),
    ("wall-mounted-lv", "Lithium Valley", "Lithium Valley Wall-Mounted LiFePO4 Battery 5.12kWh (Da2)", "LV-BAT-W5.12Da2", 80000.00, 5, ">6000", ["5.12 kWh", "51.2 V", "100 Ah"], True, None),
    ("wall-mounted-lv", "Lithium Valley", "Lithium Valley W5-E5 Wall-Mounted LiFePO4 Battery 5.12kWh", "W5-E5", 85000.00, 10, ">6000", ["5.12 kWh", "51.2 V", "100 Ah"], True, None),
    ("wall-mounted-lv", "Lithium Valley", "Lithium Valley W15-E5 Wall-Mounted LiFePO4 Battery 14.34kWh, with LCD", "W15-E5", 230000.00, 10, ">8000", ["14.34 kWh", "51.2 V", "280 Ah"], True, None),
    ("wall-mounted-lv", "Lithium Valley", "Lithium Valley W16-E5 Wall-Mounted LiFePO4 Battery 16.08kWh, with LCD", "W16-E5", 240000.00, 10, ">8000", ["16.08 kWh", "51.2 V", "314 Ah"], True, None),
]:
    add(LEKKERIX, "battery-storage", sub, brand, name, model, cost, w,
        f"{ks[0]} {ks[1]} wall or rack LiFePO4 battery rated for {cyc} cycles."
        if sub != "12v-24v" else f"{ks[0]} {ks[1]} LiFePO4 battery in a lead-acid form factor, {cyc} cycles.",
        ks, published=pub, pricing_note=note,
        specs=[{"group": "BATTERY", "label": "Cycle life", "value": cyc, "unit": "cycles"}])

add(LEKKERIX, "battery-storage", "accessories", "Lithium Valley",
    "Battery Wheels Kit for W15-5A", "W15-WHEELS", 4000.00, None,
    "Castor wheel kit for the W15-5A battery cabinet.", ["Wheel kit"], published=False, installs=False)
add(LEKKERIX, "battery-storage", "accessories", "Lithium Valley",
    "Battery Foot Pad for W15-5A", "W15-FOOTPAD", 250.00, None,
    "Foot pad for the W15-5A battery cabinet.", ["Foot pad"], published=False, installs=False)
add(LEKKERIX, "battery-storage", "accessories", "Lithium Valley",
    "Rack Battery Stacking Kit, Top and Bottom", "LV-STACK-KIT", 8500.00, None,
    "Galvanised top-and-bottom kit stacking up to six rack batteries, 300kg bearing.",
    ["Stack up to 6", "300 kg", "3 mm galvanised"], installs=False)

add(LEKKERIX, "inverters", "hybrid", "Lithium Valley",
    "Lithium Valley LV 6KHB-120 6kW Hybrid Inverter", "LV-6KHB-120", 88000.00, 5,
    "6kW single-phase hybrid inverter matched to 51.2V LiFePO4 batteries.",
    ["6 kW", "48 V class", "Hybrid"])

for w in [350, 420, 440, 450, 460, 490, 500, 520, 560, 590, 630]:
    add(LEKKERIX, "solar-panels", "monocrystalline", "Horay",
        f"Horay N-Type Solar Panel {w}W", f"HORAY-N-{w}", round(w * 18.0, 2), 15,
        f"{w}W N-type monocrystalline module from Horay's high-efficiency range.",
        [f"{w} W", "N-type"], watts=w, cost_per_watt=18.0,
        pricing_note="Priced per watt on source list (KES 18/W); module price = wattage x 18.")

add(LEKKERIX, "inverters", "all-in-one-ess", "Deye",
    "Deye Mobile Energy Storage System 12kW with 15kWh Lithium Battery", "LV-MAST-T12K-A", 680000.00, 5,
    "Mobile all-in-one energy storage: 12kW Deye inverter with 15kWh of lithium storage.",
    ["12 kW", "15 kWh", "Mobile ESS"])
add(LEKKERIX, "battery-storage", "ci-cabinets", "Lithium Valley",
    "Lithium Valley 100kWh / 50kW Air-Cooled C&I BESS with Solis Inverter", "SC100A50P-06W", 2300000.00, 5,
    "Air-cooled commercial BESS pairing a Solis 50kW hybrid inverter with 100.3kWh of HV lithium storage.",
    ["100 kWh", "50 kW", "Air-cooled"],
    specs=[{"group": "GENERAL", "label": "Battery warranty", "value": "10", "unit": "years"}])
add(LEKKERIX, "battery-storage", "ci-cabinets", "Lithium Valley",
    "Lithium Valley 215kWh / 125kW Liquid-Cooled C&I BESS with Solis Inverter", "SC215L125P-06W", 4500000.00, 5,
    "Liquid-cooled commercial BESS pairing a Solis 125kW hybrid inverter with 215kWh of HV lithium storage.",
    ["215 kWh", "125 kW", "Liquid-cooled"],
    specs=[{"group": "GENERAL", "label": "Battery warranty", "value": "10", "unit": "years"}])

for name, model, cost, ks in [
    ("Growatt SPF 3500 ES Lite Single-Phase Inverter, 48V 3.5kVA", "SPF-3500-ES-LITE", 50000.00, ["3.5 kVA", "48 V", "Single phase"]),
    ("Growatt SPF 6000 ES Plus Single-Phase Inverter, 48V 6kVA", "SPF-6000-ES-PLUS", 70000.00, ["6 kVA", "48 V", "Single phase"]),
    ("Growatt SPF 12000 ES Single-Phase Inverter, 48V 12kVA", "SPF-12000-ES", 140000.00, ["12 kVA", "48 V", "Single phase"]),
]:
    add(LEKKERIX, "inverters", "off-grid", "Growatt", name, model, cost, 5,
        f"{ks[0]} 48V single-phase inverter from Growatt's SPF ES storage range.", ks)

# =====================================================================
# Output
# =====================================================================
cats = {}
for p in products:
    cats.setdefault(p["category"], [0, 0])
    cats[p["category"]][0] += 1
    if p["is_published"]:
        cats[p["category"]][1] += 1

OUT.write_text(json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"{len(products)} SKUs written to {OUT.name}")
print(f"{sum(1 for p in products if p['is_published'])} published, "
      f"{sum(1 for p in products if not p['is_published'])} unpublished")
print(f"{sum(1 for p in products if p['price_status'] == 'needs_review')} flagged needs_review")
for c, (total, pub) in sorted(cats.items()):
    print(f"  {c:22s} {total:3d} total / {pub:3d} published")
