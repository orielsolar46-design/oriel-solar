import type { Metadata } from 'next';
import { LegalPage } from '@/components/content/legal-page';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How Oriel Power Ltd collects, uses and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="What we collect, why we collect it, and what we do not do with it. Written to comply with Kenya's Data Protection Act, 2019."
      updated="3 August 2026"
      sections={[
        {
          heading: 'Who controls your data',
          paragraphs: [
            'Oriel Power Ltd is the data controller for information collected through this site. You can reach us at orielpowerdm@gmail.com or on 0723 204 342 about anything in this policy.',
          ],
        },
        {
          heading: 'What we collect',
          paragraphs: ['We collect only what we need to sell and deliver to you:'],
          list: [
            'When you order: your name, M-Pesa phone number, delivery county and town, any delivery notes, and — if you provide them — your email address, company name and KRA PIN.',
            'When you request a call back or a quotation: your name, phone number, county and what you need.',
            'When you pay: Safaricom processes the payment and returns a transaction reference and receipt number to us. We never receive or store your M-Pesa PIN.',
            'Automatically: basic analytics about page visits, used to understand what is useful on the site.',
          ],
        },
        {
          heading: 'Why we use it',
          paragraphs: [
            'To take, deliver and support your order; to answer the questions you ask us; to send you the order confirmations, payment notices and delivery updates the sale requires; and to keep the accounting records Kenyan law obliges us to keep.',
            'We do not sell your data. We do not share it with advertisers. We do not add you to a marketing list because you bought something.',
          ],
        },
        {
          heading: 'Who we share it with',
          paragraphs: [
            'Only with parties who need it to fulfil your order: Safaricom for M-Pesa payments, our delivery carriers, our email and SMS providers for order notifications, and our hosting and database providers who store the data on our behalf.',
            'We may disclose information where the law requires it.',
          ],
        },
        {
          heading: 'How long we keep it',
          paragraphs: [
            'Order and payment records are kept for as long as tax and accounting law requires. Enquiries and quotations are kept while they are useful to answering you, and then deleted. You can ask us to delete anything sooner.',
          ],
        },
        {
          heading: 'Your rights',
          paragraphs: [
            'Under the Data Protection Act, 2019 you may ask us for a copy of the personal data we hold about you, ask us to correct it if it is wrong, ask us to delete it, or object to how we use it. Write to orielpowerdm@gmail.com and we will respond.',
            'You also have the right to complain to the Office of the Data Protection Commissioner.',
          ],
        },
        {
          heading: 'Security',
          paragraphs: [
            'The site is served over HTTPS. Payment credentials are held by Safaricom, not by us. Access to order data is restricted to staff who need it, and administrative access requires authentication.',
          ],
        },
        {
          heading: 'Cookies',
          paragraphs: [
            'We use a small number of cookies and similar storage: one to remember what is in your basket, one to keep staff signed in to the administrative area, and analytics cookies to count visits. We do not use advertising or cross-site tracking cookies.',
          ],
        },
        {
          heading: 'Review status',
          paragraphs: [
            'This policy is a working draft prepared for launch and should be reviewed by a Kenyan advocate, and registered with the Office of the Data Protection Commissioner if registration applies, before the site goes live.',
          ],
        },
      ]}
    />
  );
}
