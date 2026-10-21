import type { Metadata } from 'next';
import { PageHero } from '@/components/content/page-hero';
import { FaqList } from '@/components/content/faq-list';
import { ContactBand } from '@/components/layout/contact-band';

export const metadata: Metadata = {
  title: 'Frequently asked questions — solar in Kenya',
  description:
    'Buying, payment by M-Pesa, delivery, installation and warranty questions answered plainly.',
};

const GROUPS = [
  {
    heading: 'Buying and paying',
    faqs: [
      {
        question: 'How do I pay?',
        answer:
          'By M-Pesa, in one of two ways. Pay now: you place the order and an M-Pesa request arrives on your phone immediately. Pay on delivery: we confirm the order, deliver, and our team sends the M-Pesa request to your phone when the goods are with you. Both are M-Pesa — we do not handle cash, and you never need to carry any.',
      },
      {
        question: 'Are your prices inclusive of VAT?',
        answer:
          'Yes. Every price shown includes 16% VAT. There is no VAT added at checkout, and no charge appears that was not on the page you ordered from.',
      },
      {
        question: 'Why do some products say "Request a quote" instead of a price?',
        answer:
          'Systems above KES 500,000 are priced per project rather than from a list, because the specification, delivery and installation vary too much for a fixed figure to be honest. Tell us about the site and a written quotation follows.',
      },
      {
        question: 'Do I need an account to order?',
        answer:
          'No. Checkout is guest-only by design — name, M-Pesa number, where it is going, and that is it. Your order can be tracked afterwards with the order number and the phone you ordered with.',
      },
      {
        question: 'Can I buy on behalf of a business?',
        answer:
          'Yes. Tick the business box at checkout and enter the company name and KRA PIN so the paperwork matches your records.',
      },
    ],
  },
  {
    heading: 'Delivery and collection',
    faqs: [
      {
        question: 'Where do you deliver?',
        answer:
          'Nationwide. Delivery is priced by zone — Nairobi, Nairobi Metro, upcountry town, or remote area — and the fee is confirmed with you before dispatch. Collection from our premises is free.',
      },
      {
        question: 'How long does delivery take?',
        answer:
          'Items shown as in stock normally dispatch within one to two working days. Items on order depend on the supplier lead time, which we will tell you at the point of ordering rather than after.',
      },
      {
        question: 'What if something arrives damaged?',
        answer:
          'Tell us before you accept it if the damage is visible, and within the returns window otherwise. Solar equipment travels well but glass panels can be damaged in transit, and that is our problem to solve, not yours.',
      },
    ],
  },
  {
    heading: 'Choosing a system',
    faqs: [
      {
        question: 'How do I know what size system I need?',
        answer:
          'Send us your appliance list or a recent KPLC bill and an engineer will size it for you, stating every assumption made. For anything substantial we survey the site first — roof area, shading and your switchboard all change the design.',
      },
      {
        question: 'Can I mix brands?',
        answer:
          'For panels and mounting, generally yes. For batteries and inverters, be careful: they must match in voltage class and in communication protocol. Our product pages only suggest pairings we have verified, and we will never quote you a mismatch.',
      },
      {
        question: 'Will solar run my kettle, iron and welding machine?',
        answer:
          'It can, but those loads change the size and price of the system substantially. High-wattage heating appliances are the single most common reason a system that felt adequate on paper disappoints in use. Tell us about them honestly when you ask for a quotation.',
      },
      {
        question: 'Should I get lithium or lead-acid batteries?',
        answer:
          'We only stock LiFePO4 lithium. It tolerates heat better, can be discharged deeply without damage, needs no ventilation or topping up, and delivers thousands of cycles rather than hundreds. Over the life of a system it is almost always cheaper per unit of stored energy.',
      },
    ],
  },
  {
    heading: 'Installation and warranty',
    faqs: [
      {
        question: 'Do you install what you sell?',
        answer:
          'Yes, across Kenya. Add installation at checkout or book a site survey first. When we supply and install, one company is accountable for the whole system.',
      },
      {
        question: 'Can I install it myself?',
        answer:
          'The DC side of a solar installation is live all day and faults arc rather than self-extinguish. Panels and mounting are within reach of a competent person; inverter and battery connection, protection sizing and earthing should be done by someone qualified.',
      },
      {
        question: 'What warranty comes with the equipment?',
        answer:
          'It varies by product and is stated on every product page — commonly 5 years on inverters and batteries, longer on panels. Register your system after delivery so a claim is straightforward.',
      },
      {
        question: 'Who handles a warranty claim?',
        answer:
          'Start by contacting us with your order number. We will tell you exactly what happens next and deal with the manufacturer’s process with you.',
      },
    ],
  },
];

export default function FaqPage() {
  const allFaqs = GROUPS.flatMap((g) => g.faqs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: allFaqs.map((f) => ({
              '@type': 'Question',
              name: f.question,
              acceptedAnswer: { '@type': 'Answer', text: f.answer },
            })),
          }),
        }}
      />

      <PageHero
        eyebrow="Help"
        title="Frequently asked questions"
        intro="Buying, paying, delivery, choosing a system, installation and warranty. If your question is not here, call or WhatsApp us — an engineer will answer it."
        breadcrumbs={[{ label: 'FAQ' }]}
      />

      <div className="container-oriel space-y-12 py-12">
        {GROUPS.map((group) => (
          <FaqList key={group.heading} faqs={group.faqs} heading={group.heading} />
        ))}
      </div>

      <ContactBand />
    </>
  );
}
