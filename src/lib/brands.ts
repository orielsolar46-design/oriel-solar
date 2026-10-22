/**
 * The brand landing pages.
 *
 * People search for a brand, not for us: "ecoflow kenya", "bluetti ac500
 * price", "deltas". These pages exist to be the answer for those searches,
 * with the product range, the proof that we are a real channel, and the
 * questions a buyer asks before paying a Kenyan reseller.
 *
 * The claim itself is written once, here, so it is easy to keep true.
 */
export type BrandPage = {
  /** The brand as it is written on the product. */
  brand: string;
  /** URL segment. */
  slug: string;
  /** The badge, shown on the home page row and on the brand page. */
  badge: string;
  /** One line explaining what the badge actually promises. */
  badgeNote: string;
  /** H1 on the page. */
  heroTitle: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  highlights: { heading: string; body: string }[];
  families: { label: string; body: string; href: string }[];
  faqs: { question: string; answer: string }[];
  /** The products shown in the flagship row, in the order we want them read. */
  flagshipSlugs: string[];
  /** Where "shop the whole range" goes. */
  shopHref: string;
};

export const BRAND_PAGES: Record<string, BrandPage> = {
  ecoflow: {
    brand: 'EcoFlow',
    slug: 'ecoflow',
    badge: 'Verified EcoFlow Distributor',
    badgeNote:
      'EcoFlow stock bought through the official channel, serial registered, manufacturer warranty honoured in Nairobi — no grey imports, no parallel stock.',
    heroTitle: 'EcoFlow in Kenya: DELTA, PowerStream and EcoFlow solar',
    metaTitle: 'EcoFlow in Kenya — Verified EcoFlow Distributor',
    metaDescription:
      'Genuine EcoFlow DELTA power stations, PowerStream home systems and EcoFlow solar panels in stock in Nairobi, with local warranty handling, nationwide delivery and M-Pesa payment. A verified EcoFlow distributor in Kenya.',
    intro:
      'EcoFlow is the range Kenyan buyers ask for by name: the DELTA power stations that run a whole house through an outage, the PowerStream and home storage systems that sit behind the panels, and the folding solar that charges them. We stock it, we register it, we size it and we install it.',
    highlights: [
      {
        heading: 'Genuine stock, not grey imports',
        body: 'Every unit is bought through the official channel and comes with its serial registered, so the manufacturer warranty is real and the app and firmware work as they should.',
      },
      {
        heading: 'Warranty handled in Nairobi',
        body: 'A faulty unit is dealt with locally. Nothing is shipped back overseas, and no claim is answered with a phone number in another country.',
      },
      {
        heading: 'Sized and installed by our engineers',
        body: 'We match the station to the load — a kettle, a freezer, a router, the whole house — then deliver nationwide and install in Kenya with the correct wiring.',
      },
      {
        heading: 'Pay by M-Pesa or card',
        body: 'Delivery is paid on arrival, collection from our Nairobi premises is free, and every quotation is itemised in full.',
      },
    ],
    families: [
      {
        label: 'Portable power stations',
        body: 'DELTA Pro 3, DELTA 3 Ultra, DELTA 3 Max and DELTA 3 Plus, for fridges, laptops, tools and short outages.',
        href: '/shop/battery-storage?type=portable-power-station',
      },
      {
        label: 'Home battery systems',
        body: 'PowerStream and home storage that sit with the solar array and carry the house through the night.',
        href: '/shop/battery-storage',
      },
      {
        label: 'EcoFlow solar panels',
        body: 'Fixed, portable and folding panels, from 45 W for a phone to 400 W for a full array.',
        href: '/shop/solar-panels',
      },
      {
        label: 'Inverters and accessories',
        body: 'Hybrid inverters, MC4 cabling, XT60 adapters and the rest of the balance of system.',
        href: '/shop/inverters',
      },
    ],
    faqs: [
      {
        question: 'Are these genuine EcoFlow products?',
        answer:
          'Yes. Every EcoFlow unit we sell is bought through the official distribution channel, arrives sealed with the manufacturer serial number, and is registered so the warranty applies. We do not sell parallel or grey-import stock.',
      },
      {
        question: 'What is the warranty on an EcoFlow power station?',
        answer:
          'The manufacturer warranty applies and we handle the claim from Nairobi, so you are not posting a multi-kilogram battery overseas. The exact term is stated on each product page.',
      },
      {
        question: 'How long does delivery take?',
        answer:
          'Nairobi and the surrounding area is next working day. Elsewhere in Kenya we deliver by courier, typically two to four working days, and we install in the major towns.',
      },
      {
        question: 'Which EcoFlow model do I need?',
        answer:
          'Tell us what you want to run and for how long. A 1,024 Wh DELTA 3 Plus runs a laptop all day and a fridge for a night; a PowerStream or home system with solar carries a whole house. We size it and quote it before you pay anything.',
      },
      {
        question: 'Do you install and maintain EcoFlow systems?',
        answer:
          'Yes. We install in Nairobi and the major towns, wire the panels, commission the station with you, and show you how the app, the charge settings and the load priorities work.',
      },
    ],
    flagshipSlugs: [
      'ecoflow-delta-pro-3-portable-power-station',
      'ecoflow-delta-3-ultra-portable-power-station',
      'ecoflow-delta-3-max-portable-power-station',
      'ecoflow-delta-3-plus-portable-power-station',
    ],
    shopHref: '/shop?brand=EcoFlow',
  },

  bluetti: {
    brand: 'Bluetti',
    slug: 'bluetti',
    badge: 'Verified Bluetti Distributor',
    badgeNote:
      'Bluetti stock bought through the official channel, serial registered, manufacturer warranty honoured in Nairobi — no grey imports, no parallel stock.',
    heroTitle: 'Bluetti in Kenya: home storage, modular systems and portable power',
    metaTitle: 'Bluetti in Kenya — Verified Bluetti Distributor',
    metaDescription:
      'Genuine Bluetti home storage, modular power stations and solar panels in stock in Nairobi, with local warranty handling, nationwide delivery and M-Pesa payment. A verified Bluetti distributor in Kenya.',
    intro:
      'Bluetti is the name behind the big home batteries: the EP760 that carries a whole house, the AC500 and AC300 modular systems that scale with the load, and the AC200P and AC180P that travel. We stock the range, we register the serials, we size the system and we install it.',
    highlights: [
      {
        heading: 'Genuine stock, not grey imports',
        body: 'Every unit is bought through the official channel and comes with its serial registered, so the manufacturer warranty is real and the firmware and app behave as they should.',
      },
      {
        heading: 'Warranty handled in Nairobi',
        body: 'A faulty module or station is dealt with locally, with no shipping back overseas and no claim answered by a call centre in another country.',
      },
      {
        heading: 'Sized and installed by our engineers',
        body: 'We match the battery to the load and the solar to the roof, then deliver nationwide and install in Kenya with the correct wiring and commissioning.',
      },
      {
        heading: 'Pay by M-Pesa or card',
        body: 'Delivery is paid on arrival, collection from our Nairobi premises is free, and every quotation is itemised in full.',
      },
    ],
    families: [
      {
        label: 'Home battery systems',
        body: 'The Home Star series and EP-series batteries, for whole-house storage behind your own panels.',
        href: '/shop/battery-storage',
      },
      {
        label: 'Modular power stations',
        body: 'AC500 and AC300 systems that add capacity as the household load grows.',
        href: '/shop/battery-storage?type=portable-power-station',
      },
      {
        label: 'Portable power',
        body: 'AC200P, AC180P and AC50P — for a weekend off-grid, a camera crew, or a backup for the office.',
        href: '/shop/battery-storage?type=portable-power-station',
      },
      {
        label: 'Bluetti solar panels',
        body: 'PV100 and PV200 folding panels that charge the station directly in the sun.',
        href: '/shop/solar-panels',
      },
    ],
    faqs: [
      {
        question: 'Are these genuine Bluetti products?',
        answer:
          'Yes. Every Bluetti unit we sell is bought through the official distribution channel, arrives sealed with the manufacturer serial number, and is registered so the warranty applies.',
      },
      {
        question: 'Which Bluetti model is right for my home?',
        answer:
          'The Home Star and EP series are for whole-house storage with solar. The AC500 and AC300 modular systems cover heavier loads and can be expanded. The AC200P and AC180P are portable. Tell us your load and we will size it.',
      },
      {
        question: 'What is the warranty on Bluetti storage?',
        answer:
          'The manufacturer warranty applies and we handle the claim from Nairobi, so a battery module is never shipped overseas for a warranty repair.',
      },
      {
        question: 'How long does delivery take?',
        answer:
          'Nairobi and the surrounding area is next working day. Elsewhere in Kenya we deliver by courier, typically two to four working days, and we install in the major towns.',
      },
      {
        question: 'Do you install Bluetti systems?',
        answer:
          'Yes. We install in Nairobi and the major towns, wire the panels to the battery, commission the system with you and show you how the app, the charge priorities and the backup settings work.',
      },
    ],
    flagshipSlugs: [
      'bluetti-homestar-3',
      'bluetti-ep760',
      'bluetti-ac500',
      'bluetti-ac200pl',
    ],
    shopHref: '/shop?brand=Bluetti',
  },
};
