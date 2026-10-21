import { NextResponse } from 'next/server';
import { getCurrentProduct } from '@/lib/catalogue';
import { normaliseMsisdn, orderRequestSchema } from '@/lib/checkout-schema';
import { notifyOrderPlaced } from '@/lib/orders/notifications';
import { createOrder, type OrderLine } from '@/lib/orders/store';

export const dynamic = 'force-dynamic';

/**
 * Order creation (MASTERPLAN 10.3 rule 1): the server recalculates the entire
 * order from the catalogue. The browser sends slugs and quantities only —
 * never prices. Unpriced or quote-only items are rejected, not guessed.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  const parsed = orderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Check the highlighted details and try again' },
      { status: 400 }
    );
  }
  const { details, lines } = parsed.data;

  const phone = normaliseMsisdn(details.phone);
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "We couldn't read that phone number. Check it's the right M-Pesa line." },
      { status: 400 }
    );
  }

  // Server-side recalculation — the only pricing that counts.
  const orderLines: OrderLine[] = [];
  for (const line of lines) {
    const product = await getCurrentProduct(line.slug);
    if (!product) {
      return NextResponse.json(
        { ok: false, error: 'An item in your basket is no longer available. Remove it and try again.' },
        { status: 400 }
      );
    }
    if (product.quoteOnly || product.retailPrice == null) {
      return NextResponse.json(
        {
          ok: false,
          error: `${product.name} is priced per project — request a quote for it and order the rest separately.`,
        },
        { status: 400 }
      );
    }
    orderLines.push({
      slug: product.slug,
      productName: product.name,
      modelCode: product.modelCode,
      unitPrice: product.retailPrice,
      quantity: line.quantity,
      withInstallation: Boolean(line.withInstallation),
    });
  }

  const subtotal = orderLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  // Collection is free. Delivery is charged on arrival, not here, so the fee
  // is left null and the order total covers the goods only. Nothing the buyer
  // has not agreed to is ever added to an M-Pesa request.
  const deliveryFee = details.deliveryMethod === 'collection' ? 0 : null;
  const total = subtotal + (deliveryFee ?? 0);

  const order = await createOrder({
    status: details.paymentOption === 'pay_now' ? 'pending_payment' : 'pending_cod',
    customerName: details.customerName,
    phone,
    email: details.email || null,
    // Empty for collection orders, where there is nowhere to deliver to. The
    // column is NOT NULL, and every view that shows an address branches on
    // deliveryMethod first, so the blank is never rendered.
    county: details.county ?? '',
    town: details.town || null,
    deliveryNotes: details.deliveryNotes || null,
    isBusiness: details.isBusiness,
    companyName: details.companyName || null,
    kraPin: details.kraPin || null,
    deliveryMethod: details.deliveryMethod,
    deliveryFee,
    installationRequested: details.withInstallation,
    subtotal,
    total,
    paymentOption: details.paymentOption,
    lines: orderLines,
  });

  await notifyOrderPlaced(order);

  return NextResponse.json({
    ok: true,
    orderNumber: order.orderNumber,
    accessToken: order.accessToken,
    total: order.total,
  });
}
