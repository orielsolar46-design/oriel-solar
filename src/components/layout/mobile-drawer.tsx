'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X, Phone } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/brand-icons';
import { HEADER_NAV, CONTACT } from '@/lib/navigation';

/**
 * Mobile navigation drawer (MASTERPLAN 5.2, mobile). Slides in from the right,
 * full height. The five primary links are flat and direct — no accordion, no
 * nested menus — followed by large tappable contact rows. Radix Dialog traps
 * focus and returns it to the trigger on close.
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
            <nav className="flex flex-col px-5 pt-2" aria-label="Mobile primary">
              {HEADER_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="border-b border-oriel-line py-3 font-sans text-body font-medium text-oriel-navy"
                >
                  {item.label}
                </Link>
              ))}
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
