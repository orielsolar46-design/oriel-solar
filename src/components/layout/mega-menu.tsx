import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from '@/lib/navigation';

/**
 * The Products mega menu panel (MASTERPLAN V2 5.2).
 * Columns 1–3: the seven category blocks — on hover the block takes a mist
 * background and the name turns orange. Column 4: the featured quotation
 * panel on green-soft (green talks; orange sells).
 */
export function MegaMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="container-oriel py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Categories occupy the first three columns */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.slug} className="group/card rounded-input p-1 transition-colors hover:bg-oriel-mist">
                <Link
                  href={`/shop/${cat.slug}`}
                  onClick={onNavigate}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-oriel-mist text-oriel-navy group-hover/card:bg-oriel-white">
                    <Icon size={20} strokeWidth={1.5} />
                  </span>
                  <span>
                    <span className="block font-display text-[1rem] font-semibold leading-tight text-oriel-navy transition-colors group-hover/card:text-oriel-orange">
                      {cat.name}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-oriel-slate">
                      {cat.descriptor}
                    </span>
                  </span>
                </Link>
                <ul className="ml-12 mt-1.5 space-y-1">
                  {cat.subcategories.map((sub) => (
                    <li key={sub.href}>
                      <Link
                        href={sub.href}
                        onClick={onNavigate}
                        className="text-[13px] text-oriel-navy transition-colors hover:text-oriel-orange"
                      >
                        {sub.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Column 4 — featured panel on green-soft */}
        <div className="rounded-card bg-oriel-green-soft p-6 lg:col-span-1">
          <p className="t-eyebrow text-oriel-green-deep">Not sure what you need?</p>
          <h3 className="t-h3 mt-2">Let an engineer size it</h3>
          <p className="mt-2 text-small text-oriel-navy-ink">
            Tell us what you run and we&apos;ll specify the exact panels, inverter and
            battery for it — and quote it properly.
          </p>
          <Link
            href="/request-a-quote"
            onClick={onNavigate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-input bg-oriel-orange px-4 py-2 text-small font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep"
          >
            Request a quote
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>

          <hr className="my-5 border-oriel-green-deep/20" />

          <Link
            href="/shop?category=balance-of-system"
            onClick={onNavigate}
            className="flex items-center justify-between text-small font-medium text-oriel-navy transition-colors hover:text-oriel-orange"
          >
            Balance of system
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
          <Link
            href="/shop"
            onClick={onNavigate}
            className="mt-2 flex items-center justify-between text-small font-medium text-oriel-navy transition-colors hover:text-oriel-orange"
          >
            Shop all products
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
