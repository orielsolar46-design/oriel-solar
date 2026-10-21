import type { Metadata } from 'next';
import { LegalPage } from '@/components/content/legal-page';

export const metadata: Metadata = {
  title: 'Terms of sale',
  description: 'The terms that govern purchases from Oriel Power Ltd.',
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of sale"
      intro="These terms govern purchases from Oriel Power Ltd. They are written to be read, not to be impenetrable."
      updated="3 August 2026"
      sections={[
        {
          heading: 'Who we are',
          paragraphs: [
            'Oriel Power Ltd, trading as Oriel Solar, is a company registered in Kenya and based in Nairobi. We can be reached on 0723 204 342 or at orielpowerdm@gmail.com.',
          ],
        },
        {
          heading: 'Prices and VAT',
          paragraphs: [
            'All prices displayed on this site are in Kenya Shillings and include VAT at the standard rate of 16%. The price you see on a product page is the price charged for that item.',
            'Delivery is charged separately by zone and is confirmed with you before dispatch. Installation, where requested, is quoted with your order. Neither is added silently to your total.',
            'Products above KES 500,000 are quoted per project rather than sold at a list price. Prices for those are given in writing and are valid for the period stated on the quotation.',
            'We may change prices at any time. A change does not affect an order already placed and confirmed.',
          ],
        },
        {
          heading: 'Placing an order',
          paragraphs: [
            'Adding items to your basket and completing checkout constitutes an offer to buy. Your order is accepted when we confirm it by email or SMS, at which point a contract is formed.',
            'We recalculate the total on our own server when you place an order. If a price shown to you was wrong for any reason, we will contact you before proceeding rather than charging a different amount.',
            'We may decline an order — for example where stock is unavailable, where the delivery address is outside our reach, or where we believe the specification would not work safely. If we decline, nothing is charged.',
          ],
        },
        {
          heading: 'Payment',
          paragraphs: [
            'We accept payment by M-Pesa only, in two forms: payment at the time of ordering, or payment by M-Pesa on delivery. Pay-on-delivery means our team sends an M-Pesa request to your phone at handover — it does not mean cash. We do not accept cash, cards, cheques or bank transfers.',
            'Payment is processed by Safaricom. We never see or store your M-Pesa PIN. Your PIN should never be shared with anyone, including anyone claiming to represent us.',
            'Goods remain our property until payment has been received in full.',
          ],
        },
        {
          heading: 'Delivery',
          paragraphs: [
            'We deliver across Kenya. Delivery timescales given on the site are estimates in good faith and are not guaranteed, since they depend on carriers and, for items on order, on supplier lead times.',
            'Risk in the goods passes to you on delivery or collection. Please inspect goods on arrival and tell us immediately if anything is visibly damaged.',
          ],
        },
        {
          heading: 'Installation',
          paragraphs: [
            'Where you buy installation, the work is carried out by us or by installers engaged by us. Installation is subject to a site survey; if the survey reveals that the specification purchased is unsuitable, we will tell you before proceeding and adjust the order.',
            'Solar installations involve live DC circuits. Equipment supplied by us and installed by a third party remains under manufacturer warranty, but we cannot accept responsibility for the quality of another party’s work.',
          ],
        },
        {
          heading: 'Warranty',
          paragraphs: [
            'Products carry the manufacturer’s warranty, and the period is stated on each product page. Warranty covers defects in materials and workmanship; it does not cover damage from incorrect installation, misuse, lightning, water ingress where the product is not rated for it, or unauthorised modification.',
            'Start every claim with us. Contact us with your order number and a description of the fault, and we will confirm what the manufacturer requires and what happens next.',
          ],
        },
        {
          heading: 'Returns and cancellation',
          paragraphs: [
            'Full details of how returns work, and what can and cannot be returned, are on our delivery and returns page.',
            'Nothing in these terms affects your statutory rights under Kenyan consumer law.',
          ],
        },
        {
          heading: 'Our liability',
          paragraphs: [
            'We are responsible for loss you suffer that is a foreseeable result of our breaking this contract or failing to use reasonable care. We are not responsible for losses that were not foreseeable, or for business losses where you are buying as a business.',
            'Nothing in these terms limits our liability for death or personal injury caused by negligence, or for fraud.',
          ],
        },
        {
          heading: 'Governing law',
          paragraphs: [
            'These terms are governed by the laws of Kenya, and disputes fall to the Kenyan courts.',
          ],
        },
        {
          heading: 'Review status',
          paragraphs: [
            'These terms are a working draft prepared for the launch of this site. They should be reviewed by a Kenyan advocate before the site goes live, and the placeholders above completed.',
          ],
        },
      ]}
    />
  );
}
