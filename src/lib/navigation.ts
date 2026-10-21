import {
  Sun,
  BatteryCharging,
  Zap,
  Droplets,
  Lightbulb,
  Waves,
  FilterIcon,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export type SubLink = { label: string; href: string };

export type Category = {
  /** Display order 1–7, matching the client's banner. */
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
 * The seven product families, in the exact order and wording of the client's
 * banner (MASTERPLAN 5.2). Item counts are added at render time from the
 * catalogue once it is seeded.
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
 * Primary navigation shown in the main header bar. Home leads, matching the
 * client's reference layout — the logo already links home, but an explicit
 * Home item is what people look for.
 */
export const MAIN_NAV: SubLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

/**
 * The header carries six items: Home, three product groups, About, Contact.
 *
 * Nine separate family buttons filled the bar and made it read as a list to
 * work through rather than a shop to enter. Grouping them keeps every family
 * one hover away while leaving the bar quiet. The split is how a buyer thinks
 * about the job: the panels that generate, the inverters and batteries that
 * convert and store, and the things that spend the power on water or light.
 * Inverters and batteries share a group because they are almost always bought
 * together and sized against each other.
 *
 * Water Treatment is deliberately absent until it carries stock.
 */
export type NavGroup = { label: string; slugs: string[] };

export const NAV_GROUPS: NavGroup[] = [
  { label: 'Solar Panels', slugs: ['solar-panels'] },
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
