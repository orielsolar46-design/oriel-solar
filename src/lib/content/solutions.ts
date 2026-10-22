/**
 * Solutions content (MASTERPLAN Section 4). Each page helps a buyer recognise
 * their own situation and understand what a system actually does — no invented
 * figures, no testimonials, no claims we cannot support.
 *
 * Copy is deliberately short: one line per idea. Every figure that was here
 * before is still here (roof area per kW, the KES 500,000 survey threshold,
 * the 10–125kW inverter range, the 5kWh guide); only the words around them
 * were cut. Detail a buyer needs before spending belongs in the quotation and
 * on the product page, not in the pitch.
 */

export type Solution = {
  slug: string;
  eyebrow: string;
  title: string;
  intro: string;
  /** Who this is for — the recognition test. */
  forWho: string[];
  /** What the system does, honestly. */
  does: { heading: string; body: string }[];
  /** What it will not do — trust is built here. */
  limits: string[];
  /** Which catalogue categories this draws on. */
  shopLinks: { label: string; href: string }[];
  /** Category slugs used to pull real featured products. */
  productCategories: string[];
  faqs: { question: string; answer: string }[];
};

export const SOLUTIONS: Solution[] = [
  {
    slug: 'home-backup',
    eyebrow: 'For homes',
    title: 'Home backup power',
    intro:
      'Lights, Wi-Fi, TV and fridge through every blackout. No generator.',
    forWho: [
      'Outages disrupt you',
      'Essentials on, not the whole house',
      'Done with the generator',
      'Room to add solar later',
    ],
    does: [
      {
        heading: 'It carries your essential circuits',
        body: 'Switches over in milliseconds. The router and TV never restart.',
      },
      {
        heading: 'Solar recharges it during the day',
        body: 'Panels top it up and offset daytime use.',
      },
      {
        heading: 'It grows with you',
        body: 'Add panels or capacity later. Buy the right inverter now.',
      },
    ],
    limits: [
      'Not for kettles, irons or air conditioning.',
      'Sized to your backup window. Longer outages run it flat.',
      'Reduces the bill; does not remove it.',
    ],
    shopLinks: [
      { label: 'Hybrid inverters', href: '/shop/inverters?type=hybrid' },
      { label: 'LiFePO4 batteries', href: '/shop/battery-storage?type=wall-mounted-lv' },
      { label: 'Solar panels', href: '/shop/solar-panels' },
    ],
    productCategories: ['inverters', 'battery-storage'],
    faqs: [
      {
        question: 'How long will it run during a blackout?',
        answer:
          'Your choice at design. As a guide, 5kWh covers lights, Wi-Fi, TV and fridge for an evening.',
      },
      {
        question: 'Do I need to tell KPLC?',
        answer:
          'Not if it never exports to the grid.',
      },
      {
        question: 'Can it run my borehole pump?',
        answer:
          'Sometimes — starting surge can be triple the running load. Send the rating.',
      },
    ],
  },
  {
    slug: 'full-solar-home',
    eyebrow: 'For homes',
    title: 'Full solar for your home',
    intro:
      'Generate most of what you use. Buy far less from the grid.',
    forWho: [
      'Your KPLC bill makes the maths work',
      'You have roof or ground for an array',
      'Staying, or want the value to transfer',
      'You want independence, not just backup',
    ],
    does: [
      {
        heading: 'Solar covers the day, battery covers the evening',
        body: 'The array covers the day; the battery covers the evening peak.',
      },
      {
        heading: 'The grid becomes the backup',
        body: 'KPLC fills the gaps rather than supplying everything.',
      },
      {
        heading: 'The saving compounds',
        body: 'Every unit you generate is one you never buy.',
      },
    ],
    limits: [
      'The last 20% is rarely economic to chase.',
      'Roof area, orientation and shading set a ceiling.',
      'Payback depends on your usage.',
    ],
    shopLinks: [
      { label: 'Solar panels', href: '/shop/solar-panels' },
      { label: 'Hybrid inverters', href: '/shop/inverters?type=hybrid' },
      { label: 'Battery storage', href: '/shop/battery-storage' },
    ],
    productCategories: ['solar-panels', 'inverters', 'battery-storage'],
    faqs: [
      {
        question: 'How much roof do I need?',
        answer:
          'Roughly 4–5 square metres per kilowatt — about 25 for a 5kW array.',
      },
      {
        question: 'What happens to surplus generation?',
        answer:
          'Battery first. Once full, the system generates less. Exporting needs net metering.',
      },
      {
        question: 'Is it worth it if I am renting?',
        answer:
          'Usually not. A backup system with a movable battery suits tenants.',
      },
    ],
  },
  {
    slug: 'business-commercial',
    eyebrow: 'For business',
    title: 'Solar for business and commercial sites',
    intro:
      'Cut a recurring cost and keep trading through outages. Your load runs in daylight.',
    forWho: [
      'Electricity is a real operating cost',
      'Outages cost you money',
      'Most of your load runs by day',
      'Unused roof area',
    ],
    does: [
      {
        heading: 'Daytime load is where solar wins',
        body: 'Generation and demand line up, so more is used directly.',
      },
      {
        heading: 'Continuity, costed properly',
        body: 'Which circuits must never stop, and what downtime costs.',
      },
      {
        heading: 'Three-phase and larger systems',
        body: 'Three-phase hybrid and grid-tied, 10kW to 125kW, plus battery cabinets.',
      },
    ],
    limits: [
      'Above KES 500,000 is quoted per project after a survey.',
      'Heavy motor, welding or refrigeration loads need analysis.',
      'Some roofs need strengthening first.',
    ],
    shopLinks: [
      { label: 'Three-phase inverters', href: '/shop/inverters?phase=three' },
      { label: 'Grid-tied inverters', href: '/shop/inverters?type=grid-tied' },
      { label: 'Commercial battery cabinets', href: '/shop/battery-storage?type=ci-cabinets' },
    ],
    productCategories: ['inverters', 'battery-storage'],
    faqs: [
      {
        question: 'Can we phase the investment?',
        answer:
          'Yes. Array first for the bill, storage later for continuity. Buy headroom.',
      },
      {
        question: 'Do you handle the survey and installation?',
        answer:
          'Yes. Commercial work always starts with a site survey.',
      },
      {
        question: 'What about a generator we already own?',
        answer:
          'Many hybrid inverters run it only when solar and battery are spent.',
      },
    ],
  },
  {
    slug: 'farm-irrigation',
    eyebrow: 'For farms',
    title: 'Solar irrigation and farm power',
    intro:
      'Pump on sunshine, not diesel. A tank stores water far more cheaply than a battery stores power.',
    forWho: [
      'Borehole, river, dam or well',
      'You buy diesel, or pay mains, to pump',
      'No grid, or an unreliable one',
      'You want predictable costs',
    ],
    does: [
      {
        heading: 'Store water, not electricity',
        body: 'The pump fills a raised tank. The tank is your battery, far cheaper.',
      },
      {
        heading: 'Fuel cost goes to zero',
        body: 'No diesel line, no fuel runs, less maintenance.',
      },
      {
        heading: 'Sized on head and volume',
        body: 'Total head, daily requirement, source. Get those right and it lasts.',
      },
    ],
    limits: [
      'Most water arrives midday. Night irrigation needs a tank.',
      'Output varies with sunshine. Size the tank with a buffer.',
      'Never run a pump dry. Dry-run protection is not optional.',
    ],
    shopLinks: [
      { label: 'Submersible pumps', href: '/shop/irrigation-pumps?type=submersible' },
      { label: 'Surface pumps', href: '/shop/irrigation-pumps?type=surface' },
      { label: 'Controllers & drives', href: '/shop/irrigation-pumps?type=controllers-drives' },
    ],
    productCategories: ['irrigation-pumps', 'solar-panels'],
    faqs: [
      {
        question: 'What do you need to specify a pump?',
        answer:
          'Total head, daily volume in cubic metres, and source type.',
      },
      {
        question: 'Can the same system power the farmhouse?',
        answer:
          'Better as two. A pump wants a big array and no battery; a house the opposite.',
      },
      {
        question: 'How long do solar pumps last?',
        answer:
          'Many years, if it never runs dry and the water is not abrasive.',
      },
    ],
  },
  {
    slug: 'estate-street-lighting',
    eyebrow: 'For estates and institutions',
    title: 'Estate and street lighting',
    intro:
      'All-in-one street lights for roads, compounds and parking. No trenching, no bill.',
    forWho: [
      'A road, compound, gate or car park',
      'Trenching there would be expensive',
      'Security lighting, no monthly bill',
      'An estate, institution or business',
    ],
    does: [
      {
        heading: 'Everything in one sealed unit',
        body: 'Panel, battery, controller and LED in one. Bolt to a pole, set the angle.',
      },
      {
        heading: 'Dusk to dawn, managed automatically',
        body: 'Charges by day and manages output so one charge covers the night.',
      },
      {
        heading: 'Priced per pole, not per kilowatt',
        body: 'Send the road length or compound size and we will propose a layout.',
      },
    ],
    limits: [
      'Wattage must match height and spacing, or you get dark gaps.',
      'Shaded positions will not charge. The panel needs clear sky.',
      'These are lights, not power supplies.',
    ],
    shopLinks: [
      { label: 'Flood and security lights', href: '/shop/lighting?type=flood-lights' },
      { label: 'All lighting products', href: '/shop/lighting' },
    ],
    productCategories: ['lighting'],
    faqs: [
      {
        question: 'How many lights will my road need?',
        answer:
          'Depends on wattage, pole height and spacing. Send us both.',
      },
      {
        question: 'What maintenance do they need?',
        answer:
          'Occasional panel cleaning. The battery is the wear item.',
      },
      {
        question: 'Are they secure against theft?',
        answer:
          'No ground-level battery box. Mounting height and fixings do the rest.',
      },
    ],
  },
];

export function getSolution(slug: string): Solution | undefined {
  return SOLUTIONS.find((s) => s.slug === slug);
}
