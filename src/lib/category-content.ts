/**
 * Category page content: genuine buying guidance, written to help a Kenyan
 * buyer choose — not filler (MASTERPLAN 7.2). One entry per shop category.
 *
 * Kept short on purpose. Every figure a buyer sizes against is still here
 * (200L/300L tanks, 40/60/80–100W lights, 51.2V vs high-voltage, 5–8kW
 * inverters, 5 and 10–16kWh batteries, 8m suction); the words around them were
 * cut. Anything longer belongs on the product page or in a quotation.
 */
export type CategoryContent = {
  slug: string;
  title: string;
  intro: string;
  faqs?: { question: string; answer: string }[];
};

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  'solar-panels': {
    slug: 'solar-panels',
    title: 'Solar panels in Kenya — Tier 1 modules',
    intro:
      'Watts per shilling, and watts per square metre. Higher-wattage bifacial modules need fewer panels and less rail, and add free output over a bright iron roof.',
    faqs: [
      {
        question: 'How many panels does my home need?',
        answer:
          'On daily usage, not house size. Send an appliance list or a KPLC bill.',
      },
      {
        question: 'What does bifacial mean, and is it worth it?',
        answer:
          'It generates from both faces — the rear from reflected light. At a similar price per watt, bifacial wins.',
      },
      {
        question: 'Do panels work during cloudy weather?',
        answer:
          'Yes, at reduced output. We size on measured peak sun hours for your county.',
      },
    ],
  },
  inverters: {
    slug: 'inverters',
    title: 'Solar inverters in Kenya — hybrid, off-grid and grid-tied',
    intro:
      'Hybrid runs solar, battery and KPLC together and backs you up; off-grid stands alone; grid-tied cuts the bill but shuts down in an outage. Size on peak load, not daily total.',
    faqs: [
      {
        question: 'Hybrid, off-grid or grid-tied — which do I need?',
        answer:
          'Backup plus lower bills: hybrid. No mains: off-grid. Bill only: grid-tied, cheapest per kW.',
      },
      {
        question: 'What size inverter does a typical home need?',
        answer:
          'Biggest load combination at once, plus motor surges. Many three-bedroom homes land at 5–8kW.',
      },
      {
        question: 'Does the inverter come with the battery and panels?',
        answer:
          'No — separate line items. Every inverter page lists its verified battery pairings.',
      },
    ],
  },
  'balance-of-system': {
    slug: 'balance-of-system',
    title: 'Balance of system — protection, distribution and cabling',
    intro:
      'DC breakers and surge protection sized to your string voltage, combiner and distribution boards, genuine MC4 connectors and UV-stable DC cable.',
    faqs: [
      {
        question: 'Why do I need DC breakers and surge protection?',
        answer:
          'DC faults arc rather than self-extinguish. Size both to string voltage, not battery voltage.',
      },
      {
        question: 'Can I use ordinary electrical cable for panels?',
        answer:
          'No. Ordinary cable degrades on a hot roof and becomes a fire risk. Use genuine MC4s, properly crimped.',
      },
    ],
  },
};
