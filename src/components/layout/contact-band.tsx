import { Phone } from 'lucide-react';
import { GmailIcon, WhatsAppIcon } from '@/components/ui/brand-icons';
import { CONTACT } from '@/lib/navigation';
import { CallbackForm } from '@/components/layout/callback-form';

/**
 * The deep-navy contact band (MASTERPLAN 7.1 block 12). Shared by the home
 * page and the foot of every PDP. Phone large in gold mono; WhatsApp is green
 * (green talks); the form's submit is orange (orange sells).
 */
export function ContactBand() {
  return (
    <section aria-labelledby="contact-band-heading" className="bg-oriel-navy-deep">
      <div className="container-oriel grid gap-10 py-14 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="t-eyebrow text-oriel-gold">Talk to us</p>
          <h2 id="contact-band-heading" className="t-h2 mt-2 text-oriel-white">
            An engineer answers, not a call centre.
          </h2>
          <p className="mt-3 max-w-md text-body text-oriel-white/80">
            Call us or send a WhatsApp message and an engineer will come back to you.
          </p>
          <a
            href={`tel:${CONTACT.phonePrimaryTel}`}
            className="mt-6 inline-flex items-center gap-3 font-mono text-h2 font-medium text-oriel-gold hover:underline"
          >
            <Phone size={28} strokeWidth={1.5} aria-hidden />
            {CONTACT.phonePrimary}
          </a>
          <p className="mt-1 flex items-center gap-1.5 text-small text-oriel-white/70">
            or
            <GmailIcon size={14} className="shrink-0" />
            <a href={`mailto:${CONTACT.email}`} className="underline hover:text-oriel-gold">{CONTACT.email}</a>
          </p>
          <a
            href={CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            /* Green-deep, not green: the brief's own rule is that white on
               --oriel-green fails at small sizes (3.16:1) while white on
               --oriel-green-deep passes. */
            className="mt-6 inline-flex items-center gap-2 rounded-input bg-oriel-green-deep px-6 py-3 font-sans text-body font-semibold text-oriel-white transition-colors hover:bg-oriel-green"
          >
            <WhatsAppIcon size={18} />
            Chat on WhatsApp
          </a>
        </div>

        <CallbackForm />
      </div>
    </section>
  );
}
