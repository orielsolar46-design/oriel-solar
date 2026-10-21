/**
 * Render sample receipts and invoices to PDF without starting the app.
 *
 *   npx tsx --conditions=react-server scripts/preview-document.ts [outputDir]
 *
 * The `--conditions=react-server` flag is required and not optional decoration:
 * `src/lib/documents/pdf.ts` imports `server-only`, whose default entry point
 * throws by design when it is loaded outside a server component. Under that
 * condition the package resolves to its empty build instead, so the module
 * loads in plain Node exactly as it does inside Next.
 *
 * The first sample is the client's own Labeila Hotel receipt, figure for
 * figure, so any change to the layout can be held against the paper original.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { renderDocumentPdf, documentFilename } from '@/lib/documents/pdf';
import { computeTotals, type DocumentLine, type DocumentRecord } from '@/lib/documents/types';

function build(
  overrides: Partial<DocumentRecord> & { lines: DocumentLine[]; amountPaid: number }
): DocumentRecord {
  const vatMode = overrides.vatMode ?? 'exclusive';
  const vatRate = overrides.vatRate ?? 16;
  const totals = computeTotals(overrides.lines, vatMode, vatRate, overrides.amountPaid);
  return {
    id: 'preview',
    docType: 'receipt',
    docNumber: 'ORL-RCP-2608-0001',
    status: 'paid',
    source: 'walk_in',
    orderId: null,
    orderNumber: null,
    accessToken: 'preview-token',
    customerName: 'Customer',
    customerPhone: null,
    customerEmail: null,
    customerAddress: null,
    kraPin: null,
    goodsCategories: [],
    vatMode,
    vatRate,
    paymentMethod: null,
    mpesaTill: null,
    mpesaCode: null,
    bankRef: null,
    receivedBy: null,
    notes: null,
    dueDate: null,
    issuedAt: '2026-08-07T09:00:00.000Z',
    lastSentAt: null,
    lastSentTo: null,
    createdAt: '2026-08-07T09:00:00.000Z',
    ...overrides,
    ...totals,
  };
}

/** The client's sample, reproduced exactly — the reference for the layout. */
const labeila = build({
  docNumber: 'ORL-RCP-2608-0001',
  customerName: 'Labeila Hotel',
  customerPhone: '0722 000 000',
  customerAddress: 'Kilimani, Nairobi',
  goodsCategories: ['water_heaters', 'installation'],
  paymentMethod: 'bank_transfer',
  bankRef: 'EQ/2026/44817',
  receivedBy: 'D. Adoyo',
  amountPaid: 242440,
  lines: [
    { description: 'CE Solar Heat Pump 300L', quantity: 1, unitPrice: 199940, amount: 180940 },
    { description: 'Solar AVS Switch 30A - Sollatek', quantity: 1, unitPrice: 4200, amount: 4200 },
    { description: '6" PVC Bend', quantity: 2, unitPrice: 450, amount: 900 },
    { description: 'Pressure Release Valve 3/4"', quantity: 1, unitPrice: 960, amount: 960 },
    { description: 'Installation (Materials & Labour)', quantity: 1, unitPrice: null, amount: 22000 },
  ],
});

/**
 * A web order: VAT-inclusive pricing, part paid, and a description long enough
 * to prove the column truncates rather than overflowing into QTY.
 */
const webInvoice = build({
  docType: 'invoice',
  docNumber: 'ORL-INV-2608-0007',
  status: 'part_paid',
  source: 'order',
  orderNumber: 'ORL-2608-00042',
  customerName: 'Grace Wanjiru Kamau',
  customerPhone: '254712345678',
  customerAddress: 'Ruiru, Kiambu',
  goodsCategories: ['inverters', 'solar_panels', 'delivery'],
  vatMode: 'inclusive',
  paymentMethod: 'mpesa',
  mpesaTill: '4103820',
  mpesaCode: 'TGH4KL91XZ',
  amountPaid: 50000,
  lines: [
    {
      description: 'Solis S6-EH1P5K-L 5kW Single-Phase Hybrid Inverter with integrated DC switch',
      quantity: 1,
      unitPrice: 128500,
      amount: 128500,
    },
    {
      description: 'Jinko Tiger Neo 585W Bifacial Module',
      quantity: 8,
      unitPrice: 15900,
      amount: 127200,
    },
  ],
});

async function main() {
  const outDir = path.resolve(process.argv[2] ?? '.');
  await fs.mkdir(outDir, { recursive: true });

  const jobs: [DocumentRecord, 'original' | 'duplicate' | 'both'][] = [
    [labeila, 'original'],
    [labeila, 'duplicate'],
    [labeila, 'both'],
    [webInvoice, 'both'],
  ];

  for (const [doc, mode] of jobs) {
    const bytes = await renderDocumentPdf(doc, mode);
    const file = path.join(outDir, documentFilename(doc, mode));
    await fs.writeFile(file, bytes);
    console.log(`${(bytes.length / 1024).toFixed(0)}KB  ${file}`);
  }

  console.log('\nLabeila (VAT exclusive):', {
    subtotal: labeila.subtotal,
    vat: labeila.vatAmount,
    total: labeila.total,
    balance: labeila.balance,
  });
  console.log('Web order (VAT inclusive):', {
    subtotal: webInvoice.subtotal,
    vat: webInvoice.vatAmount,
    total: webInvoice.total,
    balance: webInvoice.balance,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
