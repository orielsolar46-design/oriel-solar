---
title: How to read a solar panel datasheet without being misled
description: Every panel datasheet contains the numbers that matter and the numbers designed to impress. Here is how to tell them apart.
category: Panels
published: 2026-07-31
---

Panel datasheets look technical enough to be intimidating and similar enough to be useless for comparison. That is not accidental — the layout is broadly standardised, but which figures get emphasised is a marketing decision.

Here is what each number actually means, and which ones matter when you are choosing between modules.

## STC: the conditions the headline number assumes

Almost every headline figure — the "615W" in the product name — is measured at **Standard Test Conditions**: 1,000W/m² irradiance, 25°C cell temperature, and a specified air mass.

The important part is **25°C cell temperature**. On a Kenyan roof at midday, a panel's cells routinely reach 55–65°C. They are dark, they sit in full sun, and they are mounted close to hot iron sheeting.

So the STC figure is a laboratory benchmark for comparing panels against each other, not a prediction of what your roof will produce. It is not dishonest — it is a standard — but treating it as an output forecast is the most common misreading.

## NOCT: the more realistic number

Look for **NOCT** or **NMOT** figures — Nominal Operating Cell Temperature conditions, typically 800W/m² and around 20°C ambient with the cell running hotter.

The NOCT power figure is usually **20–25% lower** than the STC figure, and it is much closer to what you should expect in normal operation. If a datasheet gives both, compare panels on NOCT as well as STC.

## Temperature coefficient: the figure that matters most in Kenya

This is the number I would check first for any Kenyan installation, and it is rarely on the marketing page.

The **temperature coefficient of Pmax** tells you how much output the panel loses per degree above 25°C. It is expressed as a negative percentage per °C — commonly between **−0.29%/°C and −0.40%/°C**.

Work it through. A panel at −0.35%/°C, running at 60°C cell temperature, is 35°C above test conditions:

35 × 0.35% = **12.25% output loss**, purely from heat.

A panel at −0.29%/°C in the same conditions loses about 10.2%. Over years of hot afternoons, that difference compounds into real energy — and it costs nothing to prefer the better coefficient when the price per watt is similar.

N-type cells generally have better temperature coefficients than older P-type cells, which is a genuine reason to prefer them in a hot climate rather than merely a newer specification.

## Efficiency: useful for space, not for value

Module efficiency — commonly 20–23% — tells you how much of the light landing on the panel becomes electricity, and therefore **how much power you fit per square metre**.

It matters when roof space is limited. It does not, on its own, tell you whether a panel is good value: a lower-efficiency panel at a better price per watt may be the smarter buy if you have space, because you are buying watts, not percentages.

Ask "how many watts can I fit on my roof, and what do those watts cost?" rather than chasing the efficiency figure.

## The electrical numbers you must not ignore

These four decide whether the panel can be wired to your inverter at all.

**Voc — open-circuit voltage.** The voltage with nothing connected. This is the figure that damages inverters, because Voc **rises as temperature falls**. String several panels in series on a cold highland morning and the combined Voc can exceed the inverter's maximum DC input, destroying it. String sizing must use the coldest expected temperature, not the average.

**Isc — short-circuit current.** Determines cable and fuse sizing.

**Vmp and Imp** — voltage and current at maximum power. The string's Vmp must sit inside the inverter's MPPT operating window, or the inverter cannot extract full power even though nothing is broken.

If a supplier cannot tell you the string configuration they intend, they have not designed your system — they have listed components.

## Bifacial figures deserve scepticism

Bifacial modules generate from both faces, and datasheets often quote a headline that includes a **bifacial gain** — sometimes "up to 30%".

That gain is real but entirely dependent on what is behind the panel. Over bright ground, light-coloured roofing or a high-albedo surface with the panel raised well clear, meaningful gain is achievable. Flush-mounted on a dark roof with no gap, it approaches nothing.

Read which figure is being quoted. A "700W" bifacial panel may be a 610W front-face module with an optimistic rear-side assumption attached. Compare panels on their **front-face STC rating**, then treat bifacial gain as a bonus that depends on your specific mounting.

## Degradation and warranty

Two warranties appear on every datasheet and they are different things.

**Product warranty** covers manufacturing defects — commonly 12–15 years, sometimes longer.

**Performance warranty** guarantees output over time, typically "no more than X% first-year degradation, then no more than Y% per year, retaining at least Z% at 25 or 30 years". Lower annual degradation is better; modern N-type modules commonly claim around 0.4% per year.

A performance warranty is only worth the manufacturer standing behind it in fifteen years. That is a real argument for Tier 1 manufacturers over unknown brands, regardless of what the certificate says today.

## Certifications worth checking

**IEC 61215** (design qualification) and **IEC 61730** (safety) are the baseline. Also look for **PID resistance** — potential-induced degradation, a real failure mode in humid conditions, relevant along the Kenyan coast.

## A practical comparison checklist

When comparing two modules:

1. **Price per watt**, at the front-face STC rating.
2. **Temperature coefficient of Pmax** — lower magnitude wins, and it matters more here than in cooler markets.
3. **Voc**, checked against your inverter's maximum DC input at the coldest local temperature.
4. **Vmp**, checked against the inverter's MPPT window.
5. **Efficiency**, if roof space constrains you.
6. **Warranty terms**, both product and performance, and the manufacturer's likelihood of still existing.
7. **Physical size and weight**, against your mounting and your roof structure.

## The honest summary

The headline wattage is the least informative number on the page. It tells you what the panel does in a laboratory at 25°C, which is not where your roof is.

Compare on price per watt, temperature coefficient and warranty. Check Voc and Vmp against the inverter you intend to use. Treat bifacial gain as conditional. And if the datasheet is not available at all, that is your answer — a manufacturer confident in their product publishes the figures.

Every panel in [our range](/shop/solar-panels) lists its wattage, cell type and construction, and we link the manufacturer datasheet where it is published.
