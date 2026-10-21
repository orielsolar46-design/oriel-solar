'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import * as Accordion from '@radix-ui/react-accordion';
import { Menu, X, ChevronDown, Phone } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/brand-icons';
import { CATEGORIES, MAIN_NAV, NAV_GROUPS, CONTACT } from '@/lib/navigation';

/**
 * Mobile navigation drawer (MASTERPLAN 5.2, mobile). Slides in from the right,
 * full height. The seven categories are an accordion with their subcategory
 * links, followed by the remaining nav items, then large tappable contact rows.
 * Radix Dialog traps focus and returns it to the trigger on close.
 */
export function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-input text-oriel-navy lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={24} strokeWidth={1.5} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-oriel-navy-ink/50 data-[state=open]:animate-oriel-fade" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[88%] max-w-sm flex-col bg-oriel-white shadow-oriel-lift focus:outline-none data-[state=open]:animate-oriel-fade">
          {/* Navy header */}
          <div className="flex items-center justify-between bg-oriel-navy px-5 py-4">
            <Dialog.Title className="font-display text-h3 font-semibold text-oriel-white">
              Menu
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-input text-oriel-white"
                aria-label="Close menu"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto">
            <p className="px-5 pb-1 pt-4 t-eyebrow">Products</p>
            <Accordion.Root type="single" collapsible className="px-2">
              {NAV_GROUPS.flatMap((g) => g.slugs)
                .map((slug) => CATEGORIES.find((c) => c.slug === slug))
                .filter((c): c is (typeof CATEGORIES)[number] => Boolean(c))
                .map((cat) => {
                const Icon = cat.icon;
                return (
                  <Accordion.Item key={cat.slug} value={cat.slug} className="border-b border-oriel-line">
                    <Accordion.Header>
                      <Accordion.Trigger className="group flex w-full items-center justify-between gap-3 px-3 py-3 text-left">
                        <span className="flex items-center gap-3">
                          <Icon size={20} strokeWidth={1.5} className="text-oriel-navy" />
                          <span className="font-sans text-body font-medium text-oriel-navy">
                            {cat.navLabel}
                          </span>
                        </span>
                        <ChevronDown
                          size={18}
                          strokeWidth={1.5}
                          className="text-oriel-slate transition-transform duration-200 group-data-[state=open]:rotate-180"
                        />
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content className="overflow-hidden">
                      <ul className="space-y-1 py-1 pl-11 pr-3">
                        <li>
                          <Link
                            href={`/shop/${cat.slug}`}
                            onClick={close}
                            className="block py-1.5 text-small font-medium text-oriel-orange"
                          >
                            View all
                          </Link>
                        </li>
                        {cat.subcategories.map((sub) => (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              onClick={close}
                              className="block py-1.5 text-small text-oriel-slate"
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </Accordion.Content>
                  </Accordion.Item>
                );
              })}
            </Accordion.Root>

            {/* Remaining nav items */}
            <nav className="mt-2 flex flex-col px-5">
              {MAIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="border-b border-oriel-line py-3 font-sans text-body font-medium text-oriel-navy"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/track-order"
                onClick={close}
                className="border-b border-oriel-line py-3 font-sans text-body font-medium text-oriel-navy"
              >
                Track order
              </Link>
            </nav>
          </div>

          {/* Fixed bottom panel — green WhatsApp button, phone as a mono row.
              Green talks; orange sells (MASTERPLAN V2 2.2). */}
          <div className="border-t border-oriel-line bg-oriel-mist px-5 py-4">
            <Link
              href="/request-a-quote"
              onClick={close}
              className="mb-3 flex h-12 w-full items-center justify-center rounded-input border border-oriel-navy font-sans text-body font-semibold text-oriel-navy transition-colors hover:bg-oriel-navy hover:text-oriel-white"
            >
              Request a quote
            </Link>
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-input bg-oriel-green font-sans text-body font-semibold text-oriel-white transition-colors hover:bg-oriel-green-deep"
            >
              <WhatsAppIcon size={20} />
              Chat on WhatsApp
            </a>
            <a
              href={`tel:${CONTACT.phonePrimaryTel}`}
              className="mt-3 flex items-center justify-center gap-2 py-2 font-mono text-data font-medium text-oriel-navy"
            >
              <Phone size={18} strokeWidth={1.5} className="text-oriel-orange" />
              {CONTACT.phonePrimary}
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
