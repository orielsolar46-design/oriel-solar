import 'server-only';
import { getAllProducts, type PublicProduct } from '@/lib/catalogue';
import { rankCategories, rankProducts, querySlots } from '@/lib/search';
import { CATEGORIES, CONTACT } from '@/lib/navigation';

/**
 * The store assistant.
 *
 * It answers questions about the shop the way a good shop assistant does:
 * it knows the catalogue, it knows the prices, it knows the terms, and it
 * never invents a product that is not in the range.
 *
 * The model is open-weights and provider-neutral. Any OpenAI-compatible
 * endpoint works — Ollama on the office machine, Groq, Together, OpenRouter
 * or a vLLM server — so nothing here depends on a closed model API. Without
 * a model configured the assistant still answers, using the catalogue
 * directly, so the widget is never a dead button.
 */

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type ChatProduct = {
  slug: string;
  name: string;
  brand: string;
  price: number | null;
  image: string | null;
  href: string;
};

export type ChatReply = {
  reply: string;
  products: ChatProduct[];
  /** 'model' when an open model wrote it, 'catalogue' when we composed it. */
  source: 'model' | 'catalogue';
};

const MODEL_FALLBACK = 'llama-3.3-70b-versatile';

/**
 * Free, keyless relay for an open-weights model (GPT-OSS 20B). It is
 * best-effort: the free tier is rate-limited and can cold-start slowly, so it
 * is only tried for general questions, with a short deadline, and the
 * catalogue answer takes over if it fails. Set AI_CHAT_BASE_URL/KEY to use
 * Groq, OpenRouter, Together or an Ollama box instead.
 */
const PUBLIC_RELAY = 'https://text.pollinations.ai/openai/chat/completions';

function modelConfig() {
  const base = process.env.AI_CHAT_BASE_URL?.trim();
  const key = process.env.AI_CHAT_API_KEY?.trim();
  const model = process.env.AI_CHAT_MODEL?.trim();
  if (!base && !key) {
    return { url: PUBLIC_RELAY, key: '', model: 'openai', publicRelay: true };
  }
  // Accept either an API root (…/v1) or a full completions URL.
  const url = (base ?? 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
  return {
    url: url.endsWith('/chat/completions') ? url : `${url}/chat/completions`,
    key: key ?? '',
    model: model ?? MODEL_FALLBACK,
    publicRelay: false,
  };
}

/** The facts the assistant is allowed to answer with. */
function businessContext(): string {
  const families = CATEGORIES.map((c) => c.name).join('; ');
  return [
    'You are Baraka, the sales assistant for Oriel Solar (Oriel Power Ltd), a solar supplier and installer in Nairobi, Kenya.',
    'Introduce yourself as Baraka when the customer greets you, and sign nothing else.',
    '',
    'What we do:',
    '- We sell and install solar equipment, and we size the system for the customer.',
    '- Product families: ' + families + '.',
    '- Brands we stock: EcoFlow, Bluetti, Vestwoods, Jinko Solar, Solis, Growatt, Deye, Livoltek, Lorentz, Hanti, and our own solar lighting range.',
    '- Prices are in Kenyan shillings (KES) and include 16% VAT. Anything above KES 500,000 is priced per project.',
    '- Payment: M-Pesa or card. Delivery is paid on arrival; collection from our Nairobi premises is free.',
    '- Delivery: next working day in Nairobi, 2-4 working days elsewhere in Kenya. We install in Nairobi and the major towns.',
    '- Warranty: the manufacturer warranty applies and we handle the claim from Nairobi.',
    `- Contact: ${CONTACT.phonePrimary} / ${CONTACT.phoneSecondary}, WhatsApp ${CONTACT.whatsapp}, email ${CONTACT.email}, ${CONTACT.location}.`,
    '',
    'How to answer:',
    '- Answer only about Oriel Solar and the products in the catalogue context you are given.',
    '- Be brief: two to four sentences, or a short list. Plain English, no jargon.',
    '- Never invent a product, a price, stock or a specification. If it is not in the context, say so.',
    '- The shop always stocks all four families above. Never say a family is not stocked; if the context has no exact product, name the family and ask what the customer wants to power.',
    '- If the customer sounds ready to buy, offer to prepare a quotation and point to the request-a-quote form.',
    '- Never call yourself an AI, a bot or a chatbot. You are Baraka.',
    '- If they want a person, point them to WhatsApp: ' + CONTACT.whatsapp + '. That is the only place a person will reply.',
  ].join('\n');
}

/** The range, in one line, so the model never claims the shop is empty. */
const RANGE_OVERVIEW =
  'Range overview (always true): Portable Power Unit — EcoFlow, Bluetti and Vestwoods portable power stations and solar generators; Solars — solar panels, hybrid and off-grid inverters, lithium batteries and complete kits; Lighting — solar flood lights and street lights; Accessories — cables, mounts and adapters. Installation is available in Nairobi and the major towns.';

/** Words that carry no product signal in a chat question. */
const FILLER = new Set([
  'how', 'what', 'which', 'who', 'when', 'where', 'why', 'is', 'are', 'do', 'does', 'did',
  'you', 'your', 'i', 'we', 'my', 'me', 'the', 'a', 'an', 'have', 'has', 'in', 'stock',
  'price', 'cost', 'please', 'want', 'need', 'to', 'buy', 'sell', 'can', 'could', 'would',
  'should', 'for', 'of', 'on', 'at', 'and', 'or', 'it', 'this', 'that', 'there', 'any',
  'available', 'availability', 'tell', 'about', 'give', 'show', 'best', 'good', 'solar',
  'recommend', 'recommendation', 'suggest', 'looking', 'like', 'think', 'help',
]);

/** "How much is the Bluetti AC200L in stock?" -> "bluetti ac200l". */
function retrievalQuery(question: string): string {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((word) => word.length > 0 && !FILLER.has(word));
  return words.join(' ');
}

/** The catalogue facts that go into the prompt for this question. */
async function catalogueContext(question: string) {
  const catalogue = await getAllProducts();
  const cleaned = retrievalQuery(question);

  if (!cleaned) {
    return {
      context: `${RANGE_OVERVIEW}\nThe customer did not name a product.`,
      products: [],
      catalogue,
    };
  }

  const slotCount = querySlots(cleaned).slots.length;
  // A two-word question like "inverter shop" should still find inverters even
  // though "shop" is not in any product; a long off-topic question should not
  // scrape a hit off one stray number.
  const needed = slotCount <= 2 ? 1 : Math.ceil(slotCount * 0.5);

  const productHits = rankProducts(catalogue, cleaned)
    // A card is a product we are recommending, so it must match on something
    // that names it — not a stray word buried in a description.
    .filter(
      (hit) =>
        hit.matchedTerms >= needed &&
        hit.score >= 1 &&
        hit.fields.some((field) => field !== 'description' && field !== 'specification')
    )
    .slice(0, 6);
  const familyHits = rankCategories(cleaned)
    .filter((hit) => hit.matchedTerms >= needed)
    .slice(0, 3);

  const products: ChatProduct[] = productHits.map((hit) => ({
    slug: hit.item.slug,
    name: hit.item.name,
    brand: hit.item.brand,
    price: hit.item.retailPrice,
    image: hit.item.images[0]?.url ?? null,
    href: `/shop/${hit.item.category}/${hit.item.slug}`,
  }));

  const lines: string[] = [];
  if (familyHits.length > 0) {
    lines.push('Matching families:');
    for (const hit of familyHits) {
      lines.push(`- ${hit.item.name} — ${hit.item.descriptor} (${hit.item.href})`);
    }
    lines.push('');
  }
  if (productHits.length > 0) {
    lines.push('Matching products:');
    for (const hit of productHits) {
      const p = hit.item;
      const price = p.retailPrice != null ? `KES ${p.retailPrice.toLocaleString('en-KE')}` : 'price on request';
      const specs = p.keySpecs.length > 0 ? ` [${p.keySpecs.join(', ')}]` : '';
      lines.push(`- ${p.name} (${p.brand})${specs} — ${price} — /shop/${p.category}/${p.slug}`);
    }
  } else {
    lines.push('No product in the catalogue matches this question directly.');
  }

  return { context: `${RANGE_OVERVIEW}\n\n${lines.join('\n')}`, products, catalogue };
}

/* ------------------------------------------------------------------ */
/* The model                                                           */
/* ------------------------------------------------------------------ */

async function askModel(
  messages: ChatMessage[],
  context: string
): Promise<string | null> {
  const config = modelConfig();

  const body = {
    model: config.model,
    temperature: 0.2,
    max_tokens: 400,
    messages: [
      { role: 'system', content: `${businessContext()}\n\nCatalogue context for this question:\n${context}` },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  };

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.key ? { Authorization: `Bearer ${config.key}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.publicRelay ? 8000 : 20000),
    });
    if (!response.ok) {
      console.error('Chat model error:', response.status, (await response.text()).slice(0, 300));
      return null;
    }
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text && text.length > 0 ? text : null;
  } catch (error) {
    console.error('Chat model unreachable:', error);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* The catalogue-only answer                                           */
/* ------------------------------------------------------------------ */

type Intent =
  | 'greeting'
  | 'delivery'
  | 'payment'
  | 'warranty'
  | 'install'
  | 'contact'
  | 'quote'
  | 'product';

/** Plain-language explanations for the questions a shop hears every week. */
const GLOSSARY: { test: RegExp; answer: string }[] = [
  {
    test: /\bhybrid inverter\b/,
    answer:
      'A hybrid inverter does three jobs in one box: it turns the DC from the panels into usable AC, charges and discharges the battery, and manages grid or generator input. It is the usual choice where you want solar and backup power in one system.',
  },
  {
    test: /\bmppt\b/,
    answer:
      'MPPT is the tracker inside the inverter that constantly adjusts to the best operating point of the panels. That is why an MPPT controller gets noticeably more out of the same panels than a cheap PWM one, especially in heat and haze.',
  },
  {
    test: /(\bkw\b.*\b(kwh|kw h)\b)|(\b(kwh|kw h)\b.*\bkw\b)/,
    answer:
      'kW is the rate at which power flows right now; kWh is the amount stored or used over time. A 5kW inverter can push up to 5kW at any moment, while a 5kWh battery holds 5kWh in total.',
  },
  {
    test: /(\blithium\b|\blfp\b).*(\blead\b|\bagm\b|\bgel\b)|(\blead\b|\bagm\b|\bgel\b).*(\blithium\b|\blfp\b)/,
    answer:
      'Lithium (LFP) batteries are lighter, last through far more cycles and can be discharged deeper. Lead-acid is cheaper up front but needs more capacity and is replaced sooner, so for daily solar cycling lithium usually works out cheaper over its life.',
  },
];

function detectIntent(question: string): Intent {
  const q = question.toLowerCase();
  if (/\b(hi|hello|hey|good (morning|afternoon|evening)|salam|mambo)\b/.test(q)) return 'greeting';
  if (/\b(deliver|delivery|ship|shipping|courier|arrive|arrival|nairobi|outside|upcountry)\b/.test(q))
    return 'delivery';
  if (/\b(pay|payment|mpesa|m-pesa|installment|credit|card|price on delivery|pod)\b/.test(q))
    return 'payment';
  if (/\b(warranty|guarantee|claim|defect|break|repair)\b/.test(q)) return 'warranty';
  if (/\b(install|installation|installer|wire|technician|electrician|setup|set up)\b/.test(q)) return 'install';
  if (/\b(contact|whatsapp|call|phone|email|reach|talk to|speak to|human|person)\b/.test(q))
    return 'contact';
  if (/\b(quote|quotation|estimate|bulk|project|installment plan)\b/.test(q)) return 'quote';
  return 'product';
}

/**
 * With no provider configured the public relay is best-effort, so it is only
 * used where it adds something: definitions, sizing questions, and questions
 * the catalogue did not match. Everything a shop assistant should answer
 * (price, delivery, payment, warranty, contact) is answered locally at once.
 */
function shouldAskModel(question: string, productHits: number): boolean {
  const config = modelConfig();
  if (!config.publicRelay) return true;

  const intent = detectIntent(question);
  if (intent !== 'product') return false;

  if (/^(what|why|explain|define|compare|difference|how (does|do|many|can|should)|which is better|is it|are they)\b/i.test(question)) {
    return true;
  }

  return productHits < 3;
}

function glossaryAnswer(question: string): string | null {
  const q = question.toLowerCase();
  for (const entry of GLOSSARY) {
    if (entry.test.test(q)) return entry.answer;
  }
  return null;
}

function catalogueAnswer(
  question: string,
  products: ChatProduct[],
  catalogue: PublicProduct[]
): string {
  const intent = detectIntent(question);
  const list = products.slice(0, 3);
  const explanation = intent === 'product' ? glossaryAnswer(question) : null;

  const lines: string[] = [];

  if (explanation) {
    lines.push(explanation);
  }

  switch (intent) {
    case 'greeting':
      lines.push(
        `Hi, I'm Baraka, the Oriel Solar assistant. I can help with solar panels, batteries, inverters, portable power, lighting and accessories, and with sizing a system for your home. What are you trying to run?`
      );
      break;
    case 'delivery':
      lines.push(
        `We deliver next working day in Nairobi and 2-4 working days elsewhere in Kenya, and we install in Nairobi and the major towns. Delivery is paid on arrival; collection from our Nairobi premises is free.`
      );
      break;
    case 'payment':
      lines.push(
        `You can pay by M-Pesa or card. Delivery is paid on arrival, and collection from our premises is free. Anything above KES 500,000 is quoted per project, so send us the load and we will price it properly.`
      );
      break;
    case 'warranty':
      lines.push(
        `Every product carries the manufacturer warranty, and we handle the claim from Nairobi, so nothing is shipped back overseas. The exact term is stated on each product page, and it is backed up by our own service team on ${CONTACT.phonePrimary}.`
      );
      break;
    case 'install':
      lines.push(
        `We size and install: tell us what you want to run and an engineer will specify the panels, inverter and battery, then we deliver and commission it with you. We install in Nairobi and the major towns.`
      );
      break;
    case 'contact':
      lines.push(
        `You can reach us on ${CONTACT.phonePrimary} or ${CONTACT.phoneSecondary}, on WhatsApp ${CONTACT.whatsapp}, or by email at ${CONTACT.email}. We are at ${CONTACT.location}. For a written quotation, the request-a-quote form is the fastest route.`
      );
      break;
    case 'quote':
      lines.push(
        `Send us the request-a-quote form with what you want to run — appliances, a shop, a borehole — and we will come back within one working day with a priced system. For anything above KES 500,000 we do a site survey first.`
      );
      break;
    default:
      break;
  }

  if (intent === 'product' && !explanation) {
    if (list.length > 0) {
      lines.push('');
      lines.push('From the catalogue right now:');
      for (const p of list) {
        const price = p.price != null ? `KES ${p.price.toLocaleString('en-KE')}` : 'price on request';
        lines.push(`- ${p.name} (${p.brand}) — ${price}`);
      }
    } else if (intent === 'product' && !explanation && catalogue.length > 0) {
      lines.push('');
      lines.push(
        `I can only help with the Oriel Solar range — panels, batteries, inverters, portable power, lighting and accessories. Tell me what you want to power and I will find the right match.`
      );
    }
  }

  lines.push('');
  lines.push(
    `Want a proper quotation? Use the request-a-quote form, or message us on WhatsApp: ${CONTACT.whatsapp}.`
  );

  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/* Public entry point                                                  */
/* ------------------------------------------------------------------ */

export async function answerQuestion(messages: ChatMessage[]): Promise<ChatReply> {
  const question = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const trimmed = question.trim();

  if (!trimmed) {
    return {
      reply: "Hi, I'm Baraka. Ask me anything about solar panels, batteries, inverters, lighting or accessories.",
      products: [],
      source: 'catalogue',
    };
  }

  const { products, catalogue, context } = await catalogueContext(trimmed);
  const history = messages.slice(-8);
  const intent = detectIntent(trimmed);
  // Only product questions show product cards, and not when the answer is a
  // plain-language explanation; a delivery answer should not trail a row of
  // unrelated products either.
  const visibleProducts =
    intent === 'product' && !glossaryAnswer(trimmed) ? products : [];

  if (shouldAskModel(trimmed, products.length)) {
    const fromModel = await askModel(history, context);
    if (fromModel) {
      return { reply: fromModel, products: visibleProducts, source: 'model' };
    }
  }

  return {
    reply: catalogueAnswer(trimmed, products, catalogue),
    products: visibleProducts,
    source: 'catalogue',
  };
}
