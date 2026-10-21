import type { Metadata } from 'next';
import { LegalPage } from '@/components/content/legal-page';

export const metadata: Metadata = {
  title: 'Delivery & returns',
  description:
    'Delivery zones and timeframes across Kenya, collection, and how returns and damaged goods are handled.',
};

export default function DeliveryReturnsPage() {
  return (
    <LegalPage
      title="Delivery & returns"
      intro="How your order reaches you, what it costs, and what happens if something is wrong with it."
      updated="3 August 2026"
      sections={[
        {
          heading: 'Where we deliver',
          paragraphs: [
            'We deliver throughout Kenya. Delivery is priced by zone, and the zone is chosen at checkout:',
          ],
          list: [
            'Nairobi — within the city',
            'Nairobi Metro — Kiambu, Machakos and Kajiado counties',
            'Upcountry town — county and major town centres nationwide',
            'Remote area — locations beyond regular carrier routes',
          ],
        },
        {
          heading: 'What delivery costs',
          paragraphs: [
            'Delivery is quoted per order rather than from a fixed rate card, because cost depends on the county, the town and how accessible the site is.',
            'Your delivery charge is confirmed with you before dispatch. Nothing is added to your total without you seeing it first — this is why the checkout shows delivery as "confirmed before dispatch" rather than guessing a figure.',
            'Large or heavy consignments — full arrays, commercial battery cabinets, water heaters — may be quoted individually because carrier costs vary with weight and access.',
          ],
        },
        {
          heading: 'Collection',
          paragraphs: [
            'You are welcome to collect from us at no charge. Choose collection at checkout and we will confirm the collection point and when your order is ready.',
            'Please bring your order number and the phone number you ordered with.',
          ],
        },
        {
          heading: 'How long it takes',
          paragraphs: [
            'Items shown as in stock normally dispatch within one to two working days. Items shown as on order depend on supplier lead time, which we tell you when you order rather than after.',
            'Delivery timescales are given in good faith but are not guaranteed, since they depend on carriers and, upcountry, on road and weather conditions.',
          ],
        },
        {
          heading: 'Checking your delivery',
          paragraphs: [
            'Please inspect your goods when they arrive, before the driver leaves if possible. Solar panels are glass and can be damaged in transit despite careful packing.',
            'If anything is visibly damaged, do not accept it — tell the driver and call us on 0723 204 342 the same day. We will replace it. This is our problem to solve, not yours.',
          ],
        },
        {
          heading: 'Returns',
          paragraphs: [
            'To be returned, goods should be unused, in their original packaging, and complete with all accessories. Items must not have been installed or connected.',
            'Some items cannot be returned once used for reasons of safety and hygiene, including cut lengths of cable and opened water treatment consumables.',
            'Start a return by contacting us with your order number. We will confirm the process and the return address before you send anything back.',
          ],
        },
        {
          heading: 'Faulty goods',
          paragraphs: [
            'If a product develops a fault within its warranty period, contact us with your order number and a description of what is happening. Photographs or a short video of the fault and of the installation help enormously and often save a site visit.',
            'Faults caused by incorrect installation, lightning, water ingress into equipment not rated for it, or modification are not covered by warranty — but tell us anyway, because we can usually still help you resolve them.',
          ],
        },
        {
          heading: 'Refunds',
          paragraphs: [
            'Approved refunds are paid back to the M-Pesa number the order was paid from, normally within a few working days of the returned goods being received and checked.',
          ],
        },
      ]}
    />
  );
}
