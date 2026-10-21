# Photography needed

**183 of 273 products** are complete except for a photograph, 
so they are held back from the storefront rather than shown with a 
"photograph coming soon" placeholder.

Live now: **89** products, every one with real photography.

The hold is enforced in the database as well as in `data/products.json`:
migration `0006_photograph_required.sql` unpublishes every imageless row and
rebuilds the `products_public` view with `jsonb_array_length(images) > 0`, so a
product without a photograph cannot appear on the shop even if it is published
and priced. Adding the photograph brings the row back.

## What is needed

One photograph per product is enough to publish it. Three or four views 
(front, angled, detail, installed) is what the SRNE range has and it is 
noticeably more convincing on the product page.

Acceptable sources, in order of preference:

1. The supplier's own product photography, with written permission to use it.
2. Photographs taken at the Oriel warehouse — a plain wall and daylight is fine.
3. The manufacturer's dealer/partner portal, which most of these brands operate.

## Why these could not be sourced automatically

| Brand | Products | Reason |
| --- | --- | --- |
| Lorentz | 30 | Public site carries only marketing and schematic imagery; product photography is behind the LORENTZ partner portal |
| Hanti | 29 | No public product photography found |
| Solargen | 26 | Partly superseded — solargentechnologies.com is a WooCommerce store and photographs the ZJ Beny breakers per amperage at `/wp-content/uploads/`. Five of the six breaker ratings are now covered; the enclosures still are not |
| Hexing | 26 | No public product photography found |
| Lithium Valley | 19 | Partly superseded — the CDN does serve assets, but the product pages are JavaScript-rendered. Reach the files through the WordPress media API (`/wp-json/wp/v2/media?search=`) or the datasheet PDFs |
| Maqbul | 11 | No public product photography found |
| Horay | 11 | Superseded — horaysolar.com publishes one photograph per N-Type series at `/static/upload/image/`. Ten of the eleven are now covered |
| Livoltek | 8 | No per-model photography located |
| Jinko Solar | 6 | No per-model photography located |
| Victron Energy | 5 | Superseded — victronenergy.com does serve model-named photographs from the product page HTML at `/upload/documents/`. These five can be picked up the same way the Chloride Victron lines were |
| Shiyuan | 3 | No public product photography found |
| Lekkerix | 3 | Local distributor; no public product photography |
| Growatt | 3 | Superseded — en.growatt.com responds and serves one studio shot per off-grid family from the product page HTML at `/upload/image/`. All three are now covered |
| TW Solar | 2 | No per-model photography located |
| Deye | 1 | Superseded — the one row is not a Deye product at all (see below); it is covered by Lithium Valley's datasheet |

## Chloride Exide (15)

These sit outside the count above: the Chloride Exide July 2026 pricelist was
imported straight into Supabase rather than into `data/products.json`, so
`data/photography_request.py` does not see it.

Of the 80 lines on that sheet, 65 now have a photograph. The 15 below do not,
and each one is a deliberate refusal rather than a gap nobody looked at —
`data/harvest_chloride_missing.py` carries the same list with the reason
against each slug.

| Product | Why not |
| --- | --- |
| Smart Solar MPPT 450/200-TR | Victron publish no Tr photograph for the 450/200. Their only 450/200 shots are of the MC4, and the unit's own front label reads MC4 |
| Deye 5.12 kW (HV) BOS-G Pro | Deye photograph BOS-G Pro only as a complete C&I rack of a dozen modules; this line sells one 5.12 kWh module |
| Deye 5.12 kW (HV) BOS-W | As above |
| Deye 5.12 kW (LV) BOS-W | As above |
| Chloride Solar Lithium 10.24 kWh | Not on Chloride's own store, and not published anywhere else |
| Chloride Solar C&I Lithium 10.24 kWh CS-XH | As above; the CS-XH model code returns nothing |
| Chloride Solar 125kW/261kWh C&I ESS | As above |
| Chloride Solar Lithium 16.06 kWh | As above |
| FirstBattery Lithium 5.1 kWh | No manufacturer under that name could be identified |
| Chloride Solar VTT 100L | Chloride's store carries no vacuum-tube heater at all |
| Solar Air Conditioner, mount type | Not on Chloride's store, and not published anywhere else |
| Swimming Pool Heat Pump 220-240V | As above; the domestic heat pump is a different product |
| Swimming Pool Heat Pump 380-415V | As above |
| Eastman 200Ah 12V Deep Cycle Lead Carbon | Eastman's own sites do not resolve. Chloride list only the tubular gel, which is a different chemistry in a differently labelled case |
| Eastman 230Ah 12V Deep Cycle Lead Carbon | As above |

The cheapest fix for most of these is one photograph each from Chloride Exide,
who stock them.

## The back office "needs a look" list (25)

These are the rows the back office flags as live-but-unbuyable, oddly priced or
missing a photograph. Sixteen of the twenty-five now carry one, along with three
more Horay panels in the same state that the list did not reach.
`data/harvest_needs_a_look.py` holds the source URL for each and the reason
against every one it refused.

Covered: the 16A, 63A, 80A, 125A and 250A breakers; all three Growatt
inverters; the mobile energy storage system; and ten of the eleven Horay panels.

Still needed, and why:

| Product | Why not |
| --- | --- |
| 2-Pole PV/DC Breaker 200A | Solargen photograph the range at 80A, 125A and 250A only, and the rating is printed on every label. ZJ Beny publish BDM-125 and BDM-250 but no BDM-200 |
| 3-Way Breaker Box | Solargen's store carries no breaker box; their product sitemap lists only the two ZJ Beny breaker lines |
| 6-Way Breaker Box | As above |
| 13-Way Breaker Box | As above |
| 18-Way Distribution Board, 250A | As above — Solargen publish no distribution board of any way count |
| Battery Foot Pad for W15-5A | Lithium Valley photograph the battery, not its accessories |
| Battery Wheels Kit for W15-5A | As above — the datasheet cover shows the wheels fitted to the battery, which is a photograph of the battery |
| Hexing AC Combiner Box | HXDB20R is a Hexing/Livoltek code, but neither publishes a photograph for it. The only AC combiner asset on Livoltek's regional shops is a specification table |
| Horay N-Type Solar Panel 350W | Horay's published N-Type range starts at 430W; 350W sits 80 W below anything they photograph |

Nine of these are one photograph each from Solargen and Lekkerix, who stock them.

Two things to settle that are not photography:

- **"Growatt SPF 12000 ES" is not a Growatt model.** Their ES line stops at 6kW.
  The only Growatt 48V 12kVA single-phase off-grid unit is the SPF 12000T DVM,
  and that family's photograph is what the row now carries. Confirm the model
  with Lekkerix before the row is priced and published.
- **"Deye Mobile Energy Storage System 12kW" is a Lithium Valley product.**
  `LV-MAST-T12K-A` is Lithium Valley's own model code, Lekkerix supply both
  brands, and the photography comes from Lithium Valley's datasheet. The row is
  filed under the Deye brand and should probably move.

## The 4 August 2026 wholesale list (20)

These sit outside the count above for the same reason the Chloride rows do:
`scripts/import-wholesale-2026-08.mjs` wrote its 37 products straight into
Supabase, so `data/photography_request.py` does not see them.

They also went in *published*, unlike everything else in this catalogue — the
import set `is_published` on all 37 whether or not there was a photograph, so
for two days the storefront showed "photograph coming soon" on live, priced,
buyable products. Seventeen of the 37 now carry real photography.
`data/harvest_wholesale_imagery.py` holds the source URL for each and the
reason against every one it refused.

Covered: all fourteen Solis inverters, from Ginlong's own per-family galleries;
the Dyness PowerBrick and PowerBrick MAX; and the Longi 650W bifacial panel
from the Hi-MO 9 gallery.

Still needed, and why:

| Product | Why not |
| --- | --- |
| Dyness 5.12kWh Lithium Battery | Dyness publish four different 5.12 kWh low-voltage batteries — PowerDepot G2, DL5.0C, DL5.0C Pro and DL5.0F — and they do not look alike. The row gives no model |
| Dyness HV4 Battery Disconnect Unit | PowerRack HV4 appears only in the model filter on dyness.com; no product page, no photograph |
| Dyness HV4 5.12kWh Battery Module | As above |
| Dyness Stack100 Battery Disconnect Unit | Dyness photograph STACK100 only as a complete stack of a disconnect unit and up to fifteen modules. This row sells the disconnect unit alone. Same refusal as the Deye BOS-G Pro rows |
| Dyness Stack100 5.12kWh Battery Module | As above — the only shot is of the assembled stack |
| Dyness Stack280 Battery Disconnect Unit | As Stack100 above |
| Dyness Stack280 14.3kWh Battery Module | As Stack100 above |
| X-Batt 5.12kWh Lithium Battery | Xbatt Energy Technology (szxbatt.com) is the manufacturer, but the only lithium product they publish is a VRLA replacement cell. The wall-mounted range appears on Kenyan resellers' sites and nowhere on Xbatt's own |
| X-Batt 10.24kWh Lithium Battery | As above |
| X-Batt 16kWh Lithium Battery | As above |
| SolarPro 10.2kW Hybrid Inverter | No manufacturer trades as SolarPro. A 10.2kW 48V hybrid is a common OEM chassis sold under many badges, and they are not the same unit to look at |
| Pressurised Heat Pipe Solar Water Heater 200L | Imported with no brand and no model code. Any shot chosen would be a picture of some other company's product |
| Pressurised Heat Pipe Solar Water Heater 300L | As above |
| Pressurised Flat Plate Solar Water Heater 300L | As above |
| Stainless Coil Vacuum Tube Solar Water Heater 200L | As above |
| Stainless Coil Vacuum Tube Solar Water Heater 300L | As above |
| Solar Flood Light PA-B100 | PA-B100 returns nothing from any manufacturer. The PA- and Y- codes look like a distributor's numbering rather than a maker's |
| Solar Flood Light PA-A200 | As above |
| Solar Flood Light Y-200 | As above |
| Solar Street Light PA-H200 | As above |

Fourteen of these are one warehouse photograph each — the five heaters and four
lights need nothing more than a plain wall and daylight, and the three X-Batt
and one SolarPro units are on the shelf.

Two things to settle that are not photography:

- **The fourteen wholesale Solis rows overlap nine existing catalogue rows.**
  `solis-5kw-hybrid-inverter-48v` and `solis-s6-eh1p5k-l` are the same 5kW LV
  single-phase unit at two different dealer costs (50,000 against 100,000), and
  the same is true at 8, 10, 12, 16, 15 (3P L), 20, 30 and 50 kW. The shop is
  listing both. Decide which supplier's price stands and retire the other row.
- **"SolarPro" needs a real make.** The row cannot be photographed, and a
  customer cannot be told what they are buying, until the supplier says whose
  chassis it is.

## Full list by supplier

### Lorentz (30)

| Model | Product | Category |
| --- | --- | --- |
| ACD-S4-4K | Lorentz AC Drive Sub 4" 4kW | irrigation-pumps |
| ACD-S4-5.5K | Lorentz AC Drive Sub 4" 5.5kW | irrigation-pumps |
| ACD-S6-11K | Lorentz AC Drive Sub 6" 11kW | irrigation-pumps |
| ACD-S6-5.5K | Lorentz AC Drive Sub 6" 5.5kW | irrigation-pumps |
| ECD-150-C | Lorentz EC Drive 150-C, 0.3kW | irrigation-pumps |
| ECD-200-C | Lorentz EC Drive 200-C, 0.3kW | irrigation-pumps |
| ECD-200-HR | Lorentz EC Drive 200-HR, 0.3kW | irrigation-pumps |
| ANT-EXT | Lorentz External Antenna | irrigation-pumps |
| MNSPD-115 | Lorentz MNSPD-115 Surge Protector | irrigation-pumps |
| MNSPD-600 | Lorentz MNSPD-600 Surge Protector | irrigation-pumps |
| PS-COMM-3G | Lorentz PS Communicator 3G with Global SIM | irrigation-pumps |
| PS2-150 | Lorentz PS2-150 Pump Controller, 0.3kVA | irrigation-pumps |
| PS2-200 | Lorentz PS2-200 Pump Controller, 0.3kVA | irrigation-pumps |
| PSK2-21-MB | Lorentz PSK2-21 Mainboard | irrigation-pumps |
| PSK2-25-MB | Lorentz PSK2-25 Mainboard | irrigation-pumps |
| PSK2-7-MB | Lorentz PSK2-7 Mainboard | irrigation-pumps |
| PSK2-9-MB | Lorentz PSK2-9 Mainboard | irrigation-pumps |
| PSK2-7-C | Lorentz PSk2-7 Pump Controller, 5.5kVA-D | irrigation-pumps |
| PU150-C-SJ5-4 | Lorentz PU150 C-SJ5-4 Pump Unit, RP 1 1/2 UL | irrigation-pumps |
| PU7K-C-SJ12-15 | Lorentz PU7K C-SJ12-15 Pump Unit, RP 6 | irrigation-pumps |
| PWRPK-150 | Lorentz Powerpack 150 | irrigation-pumps |
| PE-C-SJ17-11 | Lorentz Pump End C-SJ17-11, RP 2 1/2 | irrigation-pumps |
| PE-C-SJ17-18 | Lorentz Pump End C-SJ17-18, RP 2 1/2 | irrigation-pumps |
| PE-C-SJ17-7 | Lorentz Pump End C-SJ17-7, RP 2 1/4 | irrigation-pumps |
| PE-C-SJ3-18 | Lorentz Pump End C-SJ3-18, RP 1 1/4 | irrigation-pumps |
| PE-C-SJ5-4 | Lorentz Pump End C-SJ5-4, RP 1 1/2 | irrigation-pumps |
| PE-C-SJ5-8 | Lorentz Pump End C-SJ5-8, RP 1 1/2 | irrigation-pumps |
| PE-C-SJ8-15 | Lorentz Pump End C-SJ8-15, RP 2 | irrigation-pumps |
| PE-C-SJ8-37 | Lorentz Pump End C-SJ8-37, RP 2 | irrigation-pumps |
| PE-C-SJ8-7 | Lorentz Pump End C-SJ8-7, RP 2 | irrigation-pumps |

### Hanti (29)

| Model | Product | Category |
| --- | --- | --- |
| FLOAT-SW | Float Switch | irrigation-pumps |
| HBP4C-110-1500-6 | Hanti HBP4C-110-1500 DC Brushless Submersible Pump, 135m Head | irrigation-pumps |
| HBP4C-110-1500F | Hanti HBP4C-110-1500F Single-Phase DC Pump Controller | irrigation-pumps |
| HSP11K-BS | Hanti HSP11K-BS Submersible Solar Pump, 380V 11kW 3PH | irrigation-pumps |
| HSP15K-BS | Hanti HSP15K-BS Submersible Solar Pump, 380V 15kW 3PH | irrigation-pumps |
| HSP3000-BF | Hanti HSP3000-BF Submersible Solar Pump, 380V 3kW 3PH | irrigation-pumps |
| HSP5500-VC | Hanti HSP5500-VC Submersible Solar Pump, 380V 5.5kW 3PH | irrigation-pumps |
| HSPH2200L | Hanti HSPH2200L 2.2kW Single-Phase Solar Pump Inverter | irrigation-pumps |
| HSPH3700H | Hanti HSPH3700H 3.7kW Solar Pump Inverter | irrigation-pumps |
| HSPH5500H | Hanti HSPH5500H 5.5kW Solar Pump Inverter | irrigation-pumps |
| PB11KH-G3 | Hanti PB11KH-G3 11kW Hybrid Pump Controller | irrigation-pumps |
| PB5500H-G3 | Hanti PB5500H-G3 5.5kW Hybrid Pump Controller | irrigation-pumps |
| PB7500H-G3 | Hanti PB7500H-G3 7.5kW Hybrid Pump Controller | irrigation-pumps |
| SPB45K5070-4 | Hanti SPB45K5070-4 Submersible Pump Unit, 5.5kW Motor | irrigation-pumps |
| SPB45K5070-4.5 | Hanti SPB45K5070-4.5 Submersible Pump Unit, 7.5kW Motor | irrigation-pumps |
| SPB611K260-4.5 | Hanti SPB611K260-4.5 Submersible Pump Unit, 11kW Motor | irrigation-pumps |
| SPS44K0500-4 | Hanti SPS44K0500-4 Surface Pump, 4kW | irrigation-pumps |
| SPS55K51000-4 | Hanti SPS55K51000-4 Surface Pump, 5.5kW | irrigation-pumps |
| SPS57K51000-4 | Hanti SPS57K51000-4 Surface Pump, 7.5kW | irrigation-pumps |
| ISO-1000-32 | Isolator Switch 1000V 32A | irrigation-pumps |
| PVCB-1000-63-4P | PV Circuit Breaker 1000V 63A 4P | irrigation-pumps |
| S-EL-B-01 | Water Level Switch S-EL-B-01 | irrigation-pumps |
| JFP-200-TANK | Hanti JFP-200 Spare Tank | solar-water-heaters |
| JFP-300-TANK | Hanti JFP-300 Spare Tank | solar-water-heaters |
| JFP-COLLECTOR | Hanti Spare Flat-Plate Collector | solar-water-heaters |
| JFP-VTUBE | Hanti Spare Vacuum Tube | solar-water-heaters |
| SR609 | SR609 Solar Water Heater Temperature Controller | solar-water-heaters |
| ARO2A | Hanti ARO2A 7-Stage Undersink Reverse Osmosis System | water-treatment |
| ARO4A | Hanti ARO4A 3-Stage Undersink Reverse Osmosis System | water-treatment |

### Solargen (26)

| Model | Product | Category |
| --- | --- | --- |
| BB-13W | 13-Way Breaker Box | balance-of-system |
| DB18-250 | 18-Way Distribution Board with AC/DC SPD and PV Breaker, 250A | balance-of-system |
| ZB-DC-125A | 2-Pole PV/DC Breaker 125A | balance-of-system |
| ZB-DC-16A | 2-Pole PV/DC Breaker 16A | balance-of-system |
| ZB-DC-200A | 2-Pole PV/DC Breaker 200A | balance-of-system |
| ZB-DC-250A | 2-Pole PV/DC Breaker 250A | balance-of-system |
| ZB-DC-63A | 2-Pole PV/DC Breaker 63A | balance-of-system |
| ZB-DC-80A | 2-Pole PV/DC Breaker 80A | balance-of-system |
| BB-3W | 3-Way Breaker Box | balance-of-system |
| BB-6W | 6-Way Breaker Box | balance-of-system |
| PVC-4MM | DC Solar PV Cable 4mm, Black/Red (Per Metre) | balance-of-system |
| PVC-6MM | DC Solar PV Cable 6mm, Red/Black (Per Metre) | balance-of-system |
| MC4-JINKO | Jinko MC4 Connectors (Pair) | balance-of-system |
| MC4-STD | MC4 Connectors (Pair) | balance-of-system |
| Y-CONN | Y-Branch Connectors (Pair) | balance-of-system |
| ZB-SPD-1000 | ZB Surge Protection Device 1000V 2P | balance-of-system |
| ZB-SPD-600 | ZB Surge Protection Device 600V 2P | balance-of-system |
| RAIL-4700 | Aluminium Mounting Rail 4700mm | solar-panels |
| EARTH-CLIP | Earthing Clip | solar-panels |
| EARTH-LUG | Earthing Lug | solar-panels |
| RAIL-END | Rail End Clamp | solar-panels |
| RAIL-LFOOT-L | Rail L-Foot, Long | solar-panels |
| RAIL-LFOOT-S | Rail L-Foot, Short | solar-panels |
| RAIL-MID | Rail Mid Clamp | solar-panels |
| RAIL-SPLICE | Rail Splice Kit | solar-panels |
| TILE-HOOK | Roof Tile Hooks | solar-panels |

### Hexing (26)

| Model | Product | Category |
| --- | --- | --- |
| HX-3013200620 | AC Surge Protective Device, 400V 2P 20kA | balance-of-system |
| HX-3010913840 | Adjustable Voltage/Current Protector, 230VAC | balance-of-system |
| HX-3013000470 | Changeover Switch, AC 230V 2P 63A | balance-of-system |
| HX-3010913830 | DC Miniature Circuit Breaker, 600V 2P 32A | balance-of-system |
| HX-3013500270 | Fuse-Disconnector, DC 1000V 20A | balance-of-system |
| HXDB20R01002 | Hexing AC Combiner Box | balance-of-system |
| HXCB10R01002 | Hexing DC Combiner Box | balance-of-system |
| HX-MC4 | MC4 Connectors (Pair) | balance-of-system |
| HX-8010301810-B | PV Cable 6mm Black (Per Metre) | balance-of-system |
| HX-8010301810-R | PV Cable 6mm Red (Per Metre) | balance-of-system |
| HX-5110701290 | String Box Enclosure, PC, 12-Way | balance-of-system |
| HX-5110701560 | String Box Enclosure, PC, 24-Way | balance-of-system |
| HX-3013200610 | Surge Protective Device, DC 1000V 2P 20kA | balance-of-system |
| HX-3013200300 | Surge Protective Device, DC 600V 2P 20kA | balance-of-system |
| HX-8040600870 | C&I Long Guide Rail 5.9m | solar-panels |
| HX-8040600560 | End Clamp | solar-panels |
| HX-8040600380 | End Clamp 30mm | solar-panels |
| HX-8040600880 | End Clamp 33mm | solar-panels |
| HX-8040600730 | Grounding Clip GC-01 | solar-panels |
| HX-8040600720 | Grounding Lug EG-EN-01 | solar-panels |
| HX-8040600400 | L-Feet with Screws | solar-panels |
| HX-8040600590 | Mid Clamp | solar-panels |
| HX-8040600890 | Mid Clamp 30mm | solar-panels |
| HX-8040600900 | Mid Clamp 33mm | solar-panels |
| HX-8040600660 | Mini Rails with 4 Bolts | solar-panels |
| HX-8040600310 | Rail Joiner / Rail Splice | solar-panels |

### Lithium Valley (19)

| Model | Product | Category |
| --- | --- | --- |
| W15-FOOTPAD | Battery Foot Pad for W15-5A | battery-storage |
| W15-WHEELS | Battery Wheels Kit for W15-5A | battery-storage |
| SC100A50P-06W | Lithium Valley 100kWh / 50kW Air-Cooled C&I BESS with Solis Inverter | battery-storage |
| SC215L125P-06W | Lithium Valley 215kWh / 125kW Liquid-Cooled C&I BESS with Solis Inverter | battery-storage |
| LFP100-12 | Lithium Valley LFP100-12 LiFePO4 Battery 1.28kWh, 12.8V 100Ah | battery-storage |
| LFP200-12 | Lithium Valley LFP200-12 LiFePO4 Battery 2.56kWh, 12.8V 200Ah | battery-storage |
| LV-25.6V100AH | Lithium Valley LiFePO4 Battery 2.56kWh, 25.6V 100Ah | battery-storage |
| LV-BAT-R5.12Aa | Lithium Valley Rack-Mount LiFePO4 Battery 5.12kWh, 51.2V 100Ah | battery-storage |
| W10-5A | Lithium Valley W10-5A Wall-Mounted LiFePO4 Battery 10.24kWh | battery-storage |
| W15-5A | Lithium Valley W15-5A Wall-Mounted LiFePO4 Battery 14.34kWh | battery-storage |
| W15-E5 | Lithium Valley W15-E5 Wall-Mounted LiFePO4 Battery 14.34kWh, with LCD | battery-storage |
| W16-E5 | Lithium Valley W16-E5 Wall-Mounted LiFePO4 Battery 16.08kWh, with LCD | battery-storage |
| W3-5D | Lithium Valley W3-5D Wall-Mounted LiFePO4 Battery 2.56kWh, with LCD | battery-storage |
| W5-E5 | Lithium Valley W5-E5 Wall-Mounted LiFePO4 Battery 5.12kWh | battery-storage |
| LV-BAT-W10.24Ac | Lithium Valley Wall-Mounted LiFePO4 Battery 10.24kWh, 51.2V 200Ah | battery-storage |
| LV-BAT-W5.12Da2 | Lithium Valley Wall-Mounted LiFePO4 Battery 5.12kWh (Da2) | battery-storage |
| LV-BAT-W5.12Ac | Lithium Valley Wall-Mounted LiFePO4 Battery 5.12kWh, 51.2V 100Ah | battery-storage |
| LV-STACK-KIT | Rack Battery Stacking Kit, Top and Bottom | battery-storage |
| LV-6KHB-120 | Lithium Valley LV 6KHB-120 6kW Hybrid Inverter | inverters |

### Maqbul (11)

| Model | Product | Category |
| --- | --- | --- |
| MQB-BDU-HV100 | Maqbul BDU HV 100 Battery Distribution Unit | battery-storage |
| MQB-HV-5.12 | Maqbul Lithium Battery HV 5.12kWh 100Ah | battery-storage |
| MQB-LV-10 | Maqbul Lithium Battery LV 10kWh 200Ah | battery-storage |
| MQB-LV-14.3 | Maqbul Lithium Battery LV 14.3kWh 280Ah | battery-storage |
| MQB-LV-16 | Maqbul Lithium Battery LV 16.07kWh 314Ah | battery-storage |
| MQB-LV-5.12 | Maqbul Lithium Battery LV 5.12kWh 100Ah | battery-storage |
| MQB-WIFI | Maqbul Lithium Battery Wi-Fi Stick | battery-storage |
| MQB-KIT-1.2 | Maqbul 1.2kW Solar Kit with 2kWh LiFePO4 Storage | inverters |
| MQB-KIT-3 | Maqbul 3kW Solar Kit with 4kWh LiFePO4 Storage | inverters |
| MQB-AIO-5-10 | Maqbul All-in-One 5kW with 10.24kWh Storage | inverters |
| MQB-AIO-5-5 | Maqbul All-in-One 5kW with 5.12kWh Storage | inverters |

### Horay (11)

| Model | Product | Category |
| --- | --- | --- |
| HORAY-N-350 | Horay N-Type Solar Panel 350W | solar-panels |
| HORAY-N-420 | Horay N-Type Solar Panel 420W | solar-panels |
| HORAY-N-440 | Horay N-Type Solar Panel 440W | solar-panels |
| HORAY-N-450 | Horay N-Type Solar Panel 450W | solar-panels |
| HORAY-N-460 | Horay N-Type Solar Panel 460W | solar-panels |
| HORAY-N-490 | Horay N-Type Solar Panel 490W | solar-panels |
| HORAY-N-500 | Horay N-Type Solar Panel 500W | solar-panels |
| HORAY-N-520 | Horay N-Type Solar Panel 520W | solar-panels |
| HORAY-N-560 | Horay N-Type Solar Panel 560W | solar-panels |
| HORAY-N-590 | Horay N-Type Solar Panel 590W | solar-panels |
| HORAY-N-630 | Horay N-Type Solar Panel 630W | solar-panels |

### Livoltek (8)

| Model | Product | Category |
| --- | --- | --- |
| LHE34DRR11001 | Livoltek Three-Phase Smart Meter, Four-Wire DIN Rail | balance-of-system |
| BHF-C01YDR12001 | Livoltek HV G-Series Control Box | battery-storage |
| BHF-C01GTR11001 | Livoltek High-Voltage Control Box with Base | battery-storage |
| BHF-T01R11001 | Livoltek Tandem Transfer Kit with Base | battery-storage |
| GT3-125K1R11002 | Livoltek 125kW Grid-Tied Inverter WL (Unconfirmed Listing) | inverters |
| GF1-6K-WL | Livoltek 6kW Off-Grid Inverter WL (Unconfirmed Listing) | inverters |
| HP3-6K-WL | Livoltek 6kW Three-Phase Hybrid Inverter WL (Unconfirmed Listing) | inverters |
| GT3-125K-11R11002 | Livoltek GT3-125K Three-Phase Grid-Tied Inverter, 10 MPPT | inverters |

### Jinko Solar (6)

| Model | Product | Category |
| --- | --- | --- |
| JKS-4.8 | Jinko Battery 4.8kWh 48V 100Ah | battery-storage |
| JKS-H10-3P | Jinko 10kW Three-Phase Hybrid Inverter | inverters |
| JKS-H12-3P | Jinko 12kW Three-Phase Hybrid Inverter | inverters |
| JKS-H5-1P | Jinko 5kW Single-Phase Hybrid Inverter | inverters |
| JKS-H8-1P | Jinko 8kW Single-Phase Hybrid Inverter | inverters |
| JKS-H8-3P | Jinko 8kW Three-Phase Hybrid Inverter | inverters |

### Victron Energy (5)

| Model | Product | Category |
| --- | --- | --- |
| SCC010045200 | Victron BlueSolar MPPT 150/45-Tr Charge Controller | inverters |
| SCC010060200 | Victron BlueSolar MPPT 150/60-Tr Charge Controller | inverters |
| SCC115070210 | Victron SmartSolar MPPT 150/70-Tr Charge Controller | inverters |
| SCC115085210 | Victron SmartSolar MPPT 150/85-Tr Charge Controller | inverters |
| SCC125110210 | Victron SmartSolar MPPT 250/100-Tr Charge Controller | inverters |

### Shiyuan (3)

| Model | Product | Category |
| --- | --- | --- |
| 3ACDC-6.5 | Shiyuan 3AC/DC 6.5 1" Submersible AC/DC Pump, 160m Head | irrigation-pumps |
| SY-80 | Shiyuan SY-80 3" Surface Solar Pump, 15m Head | irrigation-pumps |
| SYBL-2200-4 | Shiyuan SYBL-2200-4 4" Surface Solar Pump, 16m Head | irrigation-pumps |

### Lekkerix (3)

| Model | Product | Category |
| --- | --- | --- |
| LV-BAT-W10.24Da | Lekkerix Wall-Mounted LiFePO4 Battery 10.24kWh, 51.2V 200Ah | battery-storage |
| LV-BAT-W15.36Da | Lekkerix Wall-Mounted LiFePO4 Battery 15.36kWh, 51.2V 300Ah | battery-storage |
| LV-BAT-W5.12Da | Lekkerix Wall-Mounted LiFePO4 Battery 5.12kWh, 51.2V 100Ah | battery-storage |

### Growatt (3)

| Model | Product | Category |
| --- | --- | --- |
| SPF-12000-ES | Growatt SPF 12000 ES Single-Phase Inverter, 48V 12kVA | inverters |
| SPF-3500-ES-LITE | Growatt SPF 3500 ES Lite Single-Phase Inverter, 48V 3.5kVA | inverters |
| SPF-6000-ES-PLUS | Growatt SPF 6000 ES Plus Single-Phase Inverter, 48V 6kVA | inverters |

### TW Solar (2)

| Model | Product | Category |
| --- | --- | --- |
| TW-610-BF | TW Solar 610W Bifacial Solar Panel | solar-panels |
| TW-715-BF | TW Solar 715W Bifacial Solar Panel | solar-panels |

### Deye (1)

| Model | Product | Category |
| --- | --- | --- |
| LV-MAST-T12K-A | Deye Mobile Energy Storage System 12kW with 15kWh Lithium Battery | inverters |

