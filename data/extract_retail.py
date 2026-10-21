# Pulls the supplier-stated RETAIL price out of the Solargen pricelist and
# matches it to catalogue products by model code / name.
#
# Solargen's list carries two columns — "Retail Price (KES)" and "Dealer price
# (KES)" — both VAT-inclusive. We store the dealer figure as cost_price and,
# where the supplier states a retail price, we use THAT rather than applying a
# flat markup: it is the supplier's own recommended selling price and keeps the
# site consistent with the printed list.
#
# Writes data/supplier-retail.json: { model_code: retail_price }
import json
import re
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).parent
PDF = ROOT / "source" / "solargen-pricelist-july-2026.pdf"

# Item text on the list -> model_code in our catalogue.
# Only entries we can match unambiguously are included; anything else is
# reported so it can be checked by hand rather than guessed.
products = json.loads((ROOT / "products.json").read_text(encoding="utf-8"))
solargen = [p for p in products if p["source_supplier"].startswith("Solargen")]


def norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (text or "").lower())


def parse_money(cell: str):
    if not cell:
        return None
    cleaned = re.sub(r"[^\d.]", "", cell.replace(" ", ""))
    if not cleaned or cleaned.count(".") > 1:
        return None
    try:
        value = float(cleaned)
    except ValueError:
        return None
    return value if value > 0 else None


rows = []
with pdfplumber.open(PDF) as pdf:
    for page in pdf.pages:
        for table in page.extract_tables() or []:
            for row in table:
                cells = [(c or "").replace("\n", " ").strip() for c in row]
                # Rows look like: [S/N, Item, Retail, Dealer, stock, expected]
                # but the leading blank column shifts on some tables.
                text_cells = [c for c in cells if c]
                if len(text_cells) < 3:
                    continue
                # Find the item text: the longest non-numeric cell.
                item = max(
                    (c for c in cells if c and not re.fullmatch(r"[\d\s.,]+", c)),
                    key=len,
                    default="",
                )
                if len(item) < 8:
                    continue
                idx = cells.index(item)
                money = [parse_money(c) for c in cells[idx + 1 :]]
                money = [m for m in money if m and m > 50]
                if len(money) >= 2:
                    retail, dealer = money[0], money[1]
                    # A genuine retail/dealer pair sits within a plausible
                    # band: retail above dealer, but not wildly above it.
                    # The Victron and Lorentz sections carry a single "Offer
                    # Price" column followed by a STOCK COUNT, which otherwise
                    # reads as an absurdly cheap "dealer price" (e.g. "Well
                    # probe sensor V2 | 5,751.07 | 139" — 139 is stock, not a
                    # price). Requiring dealer >= 40% of retail rejects those.
                    if dealer * 1.01 < retail <= dealer * 2.5:
                        rows.append((item, retail, dealer))

print(f"Rows with a usable retail/dealer pair: {len(rows)}")

def tokens(text: str) -> set:
    """Comparable tokens: words and numbers, lowercased, punctuation dropped."""
    return set(re.findall(r"[a-z0-9.]+", (text or "").lower().replace(",", "")))


# Match on NAME similarity, with the dealer price as confirmation. Matching on
# price alone is unsafe: several unrelated products share a figure (the Solis
# 5kW off-grid and the Maqbul 1.2kW kit are both KES 50,000), which silently
# assigns one product's retail price to another.
mapping = {}
claimed = set()
unmatched_rows = []

for item, retail, dealer in rows:
    item_tokens = tokens(item)
    best = None
    best_score = 0.0
    for p in solargen:
        if p["model_code"] in claimed:
            continue
        overlap = item_tokens & tokens(p["name"])
        if not overlap:
            continue
        score = len(overlap) / max(len(item_tokens), 1)
        # The dealer figure matching what we stored as cost is strong evidence.
        if p["cost_price"] is not None and abs(p["cost_price"] - dealer) < 0.51:
            score += 1.0
        if score > best_score:
            best, best_score = p, score
    # Require both a name overlap and either a price match or a strong name
    # match — anything weaker is reported rather than guessed.
    if best and best_score >= 1.0:
        mapping[best["model_code"]] = round(retail, 2)
        claimed.add(best["model_code"])
    else:
        unmatched_rows.append((item[:60], retail, dealer))

(ROOT / "supplier-retail.json").write_text(
    json.dumps(mapping, indent=2, ensure_ascii=False), encoding="utf-8"
)

print(f"Matched to catalogue products: {len(mapping)}")
print(f"Solargen products in catalogue: {len(solargen)}")
missing = [p for p in solargen if p["model_code"] not in mapping and p["cost_price"]]
print(f"Solargen products with NO stated retail: {len(missing)}")
for p in missing[:12]:
    print(f"   - {p['model_code']:<20} {p['name'][:52]}")
if unmatched_rows:
    print(f"\nPDF rows that matched no product ({len(unmatched_rows)}):")
    for item, retail, dealer in unmatched_rows[:8]:
        print(f"   - {item}  retail {retail:,.0f} / dealer {dealer:,.0f}")
