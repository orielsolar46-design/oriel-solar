# Populates compatible_with in data/products.json using conservative electrical
# logic. Rules applied (brief §6.5 — omit anything uncertain):
#   1. Battery <-> inverter links only within the same brand ecosystem or the
#      same supplier's marketed pairing, and only matching voltage class.
#      LV 48V-class (51.2V) never links to HV, and vice versa.
#   2. Panels -> mounting rails, clamps, MC4 connectors and DC cable from the
#      same supplier's balance-of-system range.
#   3. Inverters -> DC surge protection, DC breaker and combiner box from the
#      same supplier.
#   4. Solar water heater -> its temperature controller.
# Cross-brand HV pairings, and LV pairings with no supplier evidence, are
# deliberately omitted.
import json
from pathlib import Path

ROOT = Path(__file__).parent
products = json.loads((ROOT / "products.json").read_text(encoding="utf-8"))
by_model = {p["model_code"]: p for p in products}


def slugs(models):
    return [by_model[m]["slug"] for m in models if m in by_model]


def link(model, targets):
    p = by_model.get(model)
    if p is None:
        print(f"!! {model} missing")
        return
    existing = set(p["compatible_with"])
    p["compatible_with"] = list(existing | set(slugs(targets)))


# --- 1. Battery <-> inverter, same ecosystem, matching voltage class ---------
LIVOLTEK_LV_INV = ["GF1-6K248S3", "GF1-6KS2R11002", "GF1-8KS2-T", "GF1-12KS2-T",
                   "HP1-6KS2R11002", "HP1-8KS2MR11002", "HP1-12KS2R11002"]
for inv in LIVOLTEK_LV_INV:
    link(inv, ["BLF-B51100R21001"])
link("BLF-B51100R21001", LIVOLTEK_LV_INV)

SOLIS_LV_1P = ["S6-EO1P5K-48", "S6-EH1P5K-L", "S6-EH1P8K-L", "S6-EH1P10K-L",
               "S6-EH1P12K-L", "S6-EH1P16K-L"]
MAQBUL_LV = ["MQB-LV-5.12", "MQB-LV-10", "MQB-LV-14.3", "MQB-LV-16"]
for inv in SOLIS_LV_1P:
    link(inv, MAQBUL_LV)
for bat in MAQBUL_LV:
    link(bat, SOLIS_LV_1P)

JINKO_INV = ["JKS-H5-1P", "JKS-H8-1P"]
for inv in JINKO_INV:
    link(inv, ["JKS-4.8"])
link("JKS-4.8", JINKO_INV)

GROWATT = ["SPF-3500-ES-LITE", "SPF-6000-ES-PLUS", "SPF-12000-ES"]
LEKKERIX_LV = ["LV-BAT-W5.12Ac", "LV-BAT-W10.24Ac", "LV-BAT-W5.12Da",
               "LV-BAT-W10.24Da", "LV-BAT-W15.36Da", "LV-BAT-R5.12Aa"]
for inv in GROWATT:
    link(inv, LEKKERIX_LV)
for bat in LEKKERIX_LV:
    link(bat, GROWATT)
link("LV-6KHB-120", LEKKERIX_LV)

# Livoltek HV batteries pair with Livoltek HV control gear within their own
# stacks; inverter pairing across the HV range is not confirmed -> omitted.

# --- 2. Panels -> mounting and connectors (same supplier) --------------------
HEXING_MOUNT = ["HX-8040600660", "HX-8040600560", "HX-8040600590", "HX-MC4",
                "HX-8010301810-R", "HX-8010301810-B"]
for panel in ["TW-715-BF", "TW-610-BF"]:
    link(panel, HEXING_MOUNT)

SOLARGEN_MOUNT = ["RAIL-4700", "RAIL-MID", "RAIL-END", "MC4-STD", "PVC-4MM", "PVC-6MM"]
for panel in ["JKM445", "JKM615-BF", "JKM625-BF"]:
    link(panel, SOLARGEN_MOUNT + ["MC4-JINKO"])

HORAY_PANELS = [f"HORAY-N-{w}" for w in (350, 420, 440, 450, 460, 490, 500, 520, 560, 590, 630)]
# Lekkerix supplies no mounting hardware; Horay panels link to nothing rather
# than to another supplier's unverified rail system.

# --- 3. Inverters -> DC protection (same supplier) ---------------------------
HEXING_PROT = ["HX-3013200300", "HX-3010913830", "HXCB10R01002"]
for inv in LIVOLTEK_LV_INV + ["HYPER-5000R31003", "HYPER-5000R31005", "HYPER-6000R11001"]:
    link(inv, HEXING_PROT)

SOLARGEN_PROT = ["ZB-SPD-600", "ZB-DC-63A", "DB18-250"]
for inv in SOLIS_LV_1P + JINKO_INV + ["JKS-H8-3P", "JKS-H10-3P", "JKS-H12-3P"]:
    link(inv, SOLARGEN_PROT)

# --- 4. Water heater -> controller ------------------------------------------
link("JFP-300", ["SR609"])

(ROOT / "products.json").write_text(json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8")
n = sum(1 for p in products if p["compatible_with"])
print(f"compatible_with populated on {n} SKUs")
