import {
  Sun,
  BatteryCharging,
  Zap,
  Lightbulb,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export type SubLink = { label: string; href: string };

export type Category = {
  /** Display order in navigation. */
  order: number;
  slug: string;
  name: string;
  /** Short form for the header, where the full names do not fit side by side. */
  navLabel: string;
  icon: LucideIcon;
  descriptor: string;
  subcategories: SubLink[];
};

/**
 * The product families shown in navigation, in display order. Item counts are
 * added at render time from the catalogue.
 */
export const CATEGORIES: Category[] = [
  {
    order: 1,
    slug: 'solar-panels',
    name: 'Solar Panels — Tier 1',
    navLabel: 'Solar Panels',
    icon: Sun,
    descriptor: 'Mono & bifacial modules, 350W–715W',
    subcategories: [
      { label: 'Monocrystalline', href: '/shop/solar-panels?type=monocrystalline' },
      { label: 'Bifacial', href: '/shop/solar-panels?type=bifacial' },
      { label: 'Panel mounting & rails', href: '/shop/solar-panels?type=mounting-rails' },
    ],
  },
  {
    order: 2,
    slug: 'battery-storage',
    name: 'Battery Storage & Portable Power',
    navLabel: 'Battery Storage',
    icon: BatteryCharging,
    descriptor: 'Portable power stations, solar generators and extra batteries',
    subcategories: [
      { label: 'Portable power stations', href: '/shop/battery-storage?type=portable-power-station' },
    ],
  },
  {
    order: 3,
    slug: 'inverters',
    name: 'Inverters',
    navLabel: 'Inverters',
    icon: Zap,
    descriptor: 'Hybrid, off-grid and grid-tied, 3kW–125kW',
    subcategories: [
      { label: 'Hybrid', href: '/shop/inverters?type=hybrid' },
      { label: 'Off-grid', href: '/shop/inverters?type=off-grid' },
      { label: 'Grid-tied', href: '/shop/inverters?type=grid-tied' },
      { label: 'Three-phase', href: '/shop/inverters?phase=three' },
      { label: 'All-in-one ESS', href: '/shop/inverters?type=all-in-one-ess' },
    ],
  },
  {
    order: 4,
    slug: 'lighting',
    name: 'Lighting',
    navLabel: 'Lighting',
    icon: Lightbulb,
    descriptor: 'Solar flood lights, security lights and everyday solar lighting',
    subcategories: [
      { label: 'Flood lights', href: '/shop/lighting?type=flood-lights' },
      { label: 'Security lights with camera', href: '/shop/lighting?type=security-cameras' },
      { label: 'Solar lights', href: '/shop/lighting?type=solar-lights' },
    ],
  },
  {
    order: 5,
    slug: 'balance-of-system',
    name: 'Accessories & Balance of System',
    navLabel: 'Accessories',
    icon: Wrench,
    descriptor: 'Protection, distribution, cabling and accessories',
    subcategories: [
      { label: 'Protection & distribution', href: '/shop/balance-of-system?type=protection' },
      { label: 'Cables & connectors', href: '/shop/balance-of-system?type=cables-connectors' },
    ],
  },
];

/**
 * Primary navigation shown in the main header bar. Five direct links, no
 * dropdowns: the home page, portable power, solar panels, lighting and
 * accessories.
 */
export const HEADER_NAV: SubLink[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Portable Power Unit',
    href: '/shop/battery-storage?type=portable-power-station',
  },
  { label: 'Solars', href: '/shop/solar-panels' },
  { label: 'Lighting', href: '/shop/lighting' },
  { label: 'Accessories', href: '/shop/balance-of-system' },
];

/**
 * Secondary navigation that used to sit in the header. Kept for the footer and
 * in-page calls to action.
 */
export const MAIN_NAV: SubLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

/**
 * Short product-family groupings for menus and other callers that need a
 * label narrower than the full category name.
 */
export type NavGroup = { label: string; slugs: string[] };

export const NAV_GROUPS: NavGroup[] = [
  { label: 'Portable Power Unit', slugs: ['battery-storage'] },
  { label: 'Solars', slugs: ['solar-panels'] },
  { label: 'Lighting', slugs: ['lighting'] },
  { label: 'Inverters', slugs: ['inverters'] },
  { label: 'Accessories', slugs: ['balance-of-system'] },
];

/**
 * Pages that used to sit in the header. They are still built and still linked
 * from the footer and from in-page calls to action — the header space now goes
 * to the product families, which is what people arrive wanting.
 */
export const SECONDARY_NAV: SubLink[] = [
  { label: 'Solutions', href: '/solutions' },
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'Request a quote', href: '/request-a-quote' },
];

/** Company contact details (MASTERPLAN Section 1). */
export const CONTACT = {
  phonePrimary: '0723 204 342',
  phonePrimaryTel: '+254723204342',
  phoneSecondary: '0783 303 202',
  phoneSecondaryTel: '+254783303202',
  email: 'orielpowerdm@gmail.com',
  whatsapp: 'https://wa.me/254723204342',
  location: 'Nairobi, Kenya',
} as const;
