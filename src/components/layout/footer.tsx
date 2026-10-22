import Link from 'next/link';
import { Phone, Leaf } from 'lucide-react';
import { GmailIcon, LocationIcon, MpesaMark, WhatsAppIcon } from '@/components/ui/brand-icons';
import { SunArc } from '@/components/brand/sun-arc';
import { CATEGORIES, MAIN_NAV, CONTACT } from '@/lib/navigation';
import { BRAND_PAGES } from '@/lib/brands';

// The header now carries the product families instead of the marketing pages,
// so this column is the only route to Solutions. Without it that page and its
// five children would be reachable only from the sitemap.
const COMPANY_LINKS = [
  { label: 'About us', href: '/about' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'Guides & blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
];

const SUPPORT_LINKS = [
  { label: 'Contact', href: '/contact' },
  { label: 'Request a quote', href: '/request-a-quote' },
  { label: 'Track your order', href: '/track-order' },
  { label: 'Warranty', href: '/warranty' },
  { label: 'Delivery & returns', href: '/legal/delivery-returns' },
];

export function Footer() {
  return (
    <footer className="bg-oriel-navy-deep text-oriel-white">
      {/* Sun-arc hairline flourish (MASTERPLAN 2.4). */}
      <div className="h-3 overflow-hidden">
        <SunArc className="h-8" strokeWidth={2} id="footer-arc" />
      </div>

      <div className="container-oriel py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          {/* Brand + contact */}
          <div className="col-span-2">
            <div className="inline-flex rounded-input bg-oriel-white p-2">
              {/* Logo sits in a white chip so it reads on the navy base. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/oriel-logo.jpg" alt="Oriel Power Ltd" className="h-12 w-auto" />
            </div>
            <p className="mt-4 max-w-xs text-small text-oriel-white/70">
              Clean energy, more savings, brighter tomorrow. Tier 1 solar panels, lithium
              storage and inverters — supplied, sized and installed across Kenya.
            </p>
            <div className="mt-5 space-y-2 text-small">
              <a href={`tel:${CONTACT.phonePrimaryTel}`} className="flex items-center gap-2 text-oriel-white/90 hover:text-oriel-gold">
                <Phone size={16} strokeWidth={1.5} className="text-oriel-orange" />
                {CONTACT.phonePrimary} · {CONTACT.phoneSecondary}
              </a>
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 text-oriel-white/90 hover:text-oriel-gold">
                <GmailIcon size={15} className="shrink-0" />
                {CONTACT.email}
              </a>
              <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-oriel-white/90 hover:text-oriel-gold">
                <WhatsAppIcon size={16} className="text-oriel-green" />
                WhatsApp us
              </a>
              <p className="flex items-center gap-2 text-oriel-white/70">
                <LocationIcon size={17} tone="dark" className="shrink-0" />
                {CONTACT.location}
              </p>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="t-eyebrow text-oriel-white/60">Products</h4>
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/shop/${cat.slug}`} className="text-small text-oriel-white/80 hover:text-oriel-gold">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
            {/* The brand pages are where the brand searches land, so they are
                linked from every page on the site. */}
            <ul className="mt-4 space-y-2.5 border-t border-white/10 pt-4">
              {Object.values(BRAND_PAGES).map((brand) => (
                <li key={brand.slug}>
                  <Link href={`/${brand.slug}`} className="text-small text-oriel-white/80 hover:text-oriel-gold">
                    {brand.brand}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="t-eyebrow text-oriel-white/60">Company</h4>
            <ul className="mt-4 space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-small text-oriel-white/80 hover:text-oriel-gold">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="t-eyebrow text-oriel-white/60">Support</h4>
            <ul className="mt-4 space-y-2.5">
              {SUPPORT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-small text-oriel-white/80 hover:text-oriel-gold">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Eco strip — green carries the environmental case (MASTERPLAN V2 2.2). */}
        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card bg-oriel-green-deep px-5 py-4">
          <p className="flex items-center gap-2 text-small font-semibold text-oriel-white">
            <Leaf size={16} strokeWidth={1.5} className="text-oriel-gold" />
            Premium Quality
          </p>
          <p className="text-small text-oriel-white/90">Sustainable Solutions</p>
          <p className="text-small text-oriel-white/90">Powering a Cleaner Future</p>
        </div>

      </div>

      {/* Green closing bar, as in the client's reference: the footer ends on
          the secondary brand colour rather than fading out in navy. */}
      <div className="bg-oriel-green-deep">
        <div className="container-oriel flex flex-col gap-3 py-4 text-small text-oriel-white md:flex-row md:items-center md:justify-between">
          <p className="font-mono">
            © {new Date().getFullYear()} Oriel Power Ltd. All rights reserved.
          </p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal">
            <Link href="/legal/terms" className="hover:text-oriel-gold">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-oriel-gold">Privacy</Link>
            <Link href="/legal/delivery-returns" className="hover:text-oriel-gold">Delivery &amp; returns</Link>
            <span className="inline-flex items-center gap-1.5 text-oriel-white">
              Nairobi, Kenya · <MpesaMark height={14} tone="dark" /> accepted
            </span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
