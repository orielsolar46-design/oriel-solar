/**
 * Catalogue search.
 *
 * Shoppers do not type catalogue terms, they type what they want: "flood
 * light", "5kw", "bluetti", "invrter" (a typo), "MS-7500". This module scores
 * every published product against the query the way a search engine would:
 *
 *  - every word must land somewhere, and near misses count;
 *  - a word can land in the name, the brand, the model code, the family, the
 *    sub-family, the key specs or the description, and each counts for a
 *    different amount;
 *  - units are folded together, so "5 kw", "5kW" and "5KW" are one thing;
 *  - "flood light" matches a family as well as a product, so the search can
 *    answer a kind of item, not only a product.
 *
 * It is deliberately dependency-free and client-safe: the same code runs on
 * the server for the results page and behind the search API for the
 * suggestions in the header.
 */

import { CATEGORIES } from '@/lib/navigation';

export type SearchableSpec = { label: string; value: string; unit: string };

export type SearchableProduct = {
  slug: string;
  name: string;
  brand: string;
  modelCode: string | null;
  category: string;
  subcategory: string;
  shortDescription: string;
  longDescription: string | null;
  keySpecs: string[];
  specs: SearchableSpec[];
  retailPrice: number | null;
  images: { url: string; alt: string; type: string }[];
  stockStatus: string;
  isFeatured: boolean;
  quoteOnly: boolean;
};

export type SearchHit<T> = {
  item: T;
  score: number;
  /** Which fields carried the match, for the "matched in" line. */
  fields: string[];
  /** How many query words actually landed; used to judge relevance. */
  matchedTerms: number;
};

export type CategoryDoc = {
  slug: string;
  name: string;
  navLabel: string;
  descriptor: string;
  href: string;
  kind: 'category' | 'subcategory';
  parentName: string;
};

/* ------------------------------------------------------------------ */
/* Text preparation                                                    */
/* ------------------------------------------------------------------ */

/** Lower case, no accents, punctuation to spaces. */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Units and their plurals collapse to one token: watt/watts -> w. */
const UNIT_ALIASES: Record<string, string> = {
  watt: 'w',
  watts: 'w',
  wattage: 'w',
  kilowatt: 'kw',
  kilowatts: 'kw',
  kilo: 'kw',
  kwh: 'kwh',
  'kilowatt hour': 'kwh',
  'kilowatt hours': 'kwh',
  'kilowatt-hour': 'kwh',
  'kilowatt-hours': 'kwh',
  volt: 'v',
  volts: 'v',
  amp: 'a',
  amps: 'a',
  ampere: 'a',
  amperes: 'a',
  'amp hour': 'ah',
  'amp hours': 'ah',
  'amp-hour': 'ah',
  'amp-hours': 'ah',
  mah: 'mah',
  wh: 'wh',
  l: 'l',
  litre: 'l',
  litres: 'l',
  liter: 'l',
  liters: 'l',
};

/** Words a shopper uses for the same thing we call something else. */
const WORD_SYNONYMS: Record<string, string[]> = {
  light: ['lamp', 'lighting', 'flood', 'lumens', 'luminaire'],
  lamp: ['light', 'lighting', 'flood'],
  lighting: ['light', 'lamp'],
  flood: ['floodlight', 'light', 'flood'],
  camera: ['cctv', 'security', 'surveillance'],
  cctv: ['camera', 'security'],
  battery: ['batteries', 'accumulator', 'storage'],
  batteries: ['battery', 'storage'],
  panel: ['panels', 'module', 'modules', 'pv'],
  panels: ['panel', 'module', 'modules', 'pv'],
  module: ['panel', 'modules'],
  pump: ['pumps', 'submersible', 'surface', 'water'],
  pumps: ['pump', 'water'],
  inverter: ['inv', 'inverters'],
  charge: ['charger', 'charging'],
  charger: ['charge', 'charging'],
  generator: ['gen', 'power'],
  solar: ['pv', 'panel', 'photovoltaic'],
  kit: ['system', 'package'],
  system: ['kit', 'package'],
  price: ['cost', 'kes'],
  cheap: ['budget', 'affordable'],
};

/** Damerau-Levenshtein, so "invrter" and "pannel" are one slip, not two. */
function editDistance(a: string, b: string, max: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;

  const rows = a.length + 1;
  const cols = b.length + 1;
  let prevPrev = new Array<number>(cols).fill(0);
  let prev = new Array<number>(cols).fill(0);
  let curr = new Array<number>(cols).fill(0);

  for (let j = 0; j < cols; j += 1) prev[j] = j;

  for (let i = 1; i < rows; i += 1) {
    curr[0] = i;
    let best = curr[0];
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, prevPrev[j - 2] + 1);
      }
      curr[j] = value;
      if (value < best) best = value;
    }
    if (best > max) return max + 1;
    prevPrev = prev;
    prev = curr;
    curr = new Array<number>(cols).fill(0);
  }
  return prev[cols - 1];
}

function tokenise(text: string): string[] {
  return normalise(text)
    .split(' ')
    .map((token) => UNIT_ALIASES[token] ?? token)
    .filter(Boolean);
}

/** "5 kW" and "5kW" and "5KW" all become "5kw". */
function compact(text: string): string {
  return normalise(text).replace(/ /g, '');
}

type IndexedField = {
  key: string;
  weight: number;
  text: string;
  tokens: string[];
  compact: string;
};

function field(key: string, weight: number, text: string): IndexedField {
  return {
    key,
    weight,
    text: normalise(text),
    tokens: tokenise(text),
    compact: compact(text),
  };
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

const FIELD_LABELS: Record<string, string> = {
  model: 'model code',
  name: 'name',
  brand: 'brand',
  family: 'family',
  subtype: 'type',
  keySpecs: 'specification',
  description: 'description',
  specs: 'specification',
};

function fuzzyLimit(term: string): number {
  if (term.length >= 7) return 2;
  if (term.length >= 4) return 1;
  return 0;
}

/** How well one term lands in one field: 1 is an exact word match. */
function quality(term: string, f: IndexedField): number {
  if (!term) return 0;
  if (f.tokens.includes(term)) return 1;
  if (term.length >= 2 && f.tokens.some((token) => token.startsWith(term))) return 0.82;
  if (term.length >= 3 && f.text.includes(` ${term} `)) return 0.75;
  if (term.length >= 3 && f.text.includes(term)) return 0.6;
  // Only codes and sizes are worth squashing: "5kw" must find "5 kW", but
  // "all" must not find "All-in-One".
  if (term.length >= 3 && /\d/.test(term) && f.compact.includes(term)) return 0.55;

  const limit = fuzzyLimit(term);
  if (limit > 0) {
    for (const token of f.tokens) {
      if (Math.abs(token.length - term.length) > limit) continue;
      // A slip in the middle of a word is a typo; a different first letter is
      // a different word. Without this, "100w" would also match "200w".
      if (token.charAt(0) !== term.charAt(0)) continue;
      if (editDistance(token, term, limit) <= limit) return 0.5;
    }
  }
  return 0;
}

type TermMatch = { score: number; field: string };

function bestMatch(term: string, fields: IndexedField[]): TermMatch {
  let best: TermMatch = { score: 0, field: '' };
  for (const f of fields) {
    const q = quality(term, f);
    if (q === 0) continue;
    const score = q * f.weight;
    if (score > best.score) best = { score, field: f.key };
  }
  return best;
}

function scoreDoc(
  fields: IndexedField[],
  slots: string[][],
  phrase: string
): { score: number; fields: string[]; matchedTerms: number } {
  let total = 0;
  let matchedTerms = 0;
  const hitFields = new Set<string>();
  const perField = new Map<string, number>();
  for (const slot of slots) {
    // A word and its synonyms are alternatives: "light" is satisfied by a
    // product that says lamp, and one word that lands is one word matched.
    let best: TermMatch = { score: 0, field: '' };
    for (const alternative of slot) {
      const match = bestMatch(alternative, fields);
      if (match.score > best.score) best = match;
    }
    if (best.score <= 0) continue;
    matchedTerms += 1;
    total += best.score;
    hitFields.add(best.field);
    perField.set(best.field, (perField.get(best.field) ?? 0) + 1);
  }

  if (matchedTerms === 0) return { score: 0, fields: [], matchedTerms: 0 };

  // Every word landing in the same field is a strong signal: "flood light"
  // in one name beats the same two words scattered across two fields.
  perField.forEach((count, key) => {
    if (count === slots.length && count > 1) {
      const weight = fields.find((f) => f.key === key)?.weight ?? 1;
      total += weight * 0.8;
    }
  });

  // The whole phrase in one field is the strongest signal there is.
  for (const f of fields) {
    if (phrase.length < 3) continue;
    if (f.text.includes(phrase)) {
      total += f.weight * 2.4;
      hitFields.add(f.key);
      if (f.key === 'name' && f.text.startsWith(phrase)) total += 4;
    }
  }

  // "MS-7500-ALL" written without spaces is one token in the model code, and
  // "flood light" is one word in a product name. Matching the squashed form
  // finds those exactly, and stops the loose word matches from dragging in
  // everything else.
  const squashed = phrase.replace(/ /g, '');
  if (squashed.length >= 4) {
    for (const f of fields) {
      if (f.compact === squashed) {
        total += f.weight * 2.4;
        hitFields.add(f.key);
      } else if (squashed.length >= 6 && f.compact.includes(squashed)) {
        total += f.weight * 1.6;
        hitFields.add(f.key);
      }
    }
  }

  return { score: total, fields: Array.from(hitFields), matchedTerms };
}

/* ------------------------------------------------------------------ */
/* Index                                                               */
/* ------------------------------------------------------------------ */

const FAMILY_NAMES: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
);

const SUBTYPE_NAMES: Record<string, string> = Object.fromEntries(
  CATEGORIES.flatMap((c) => c.subcategories.map((s) => [s.href.split('type=')[1] ?? '', s.label]))
);

function productFields(product: SearchableProduct): IndexedField[] {
  const specText = product.specs
    .map((s) => `${s.label} ${s.value} ${s.unit}`)
    .join(' ');
  return [
    field('model', 3.4, product.modelCode ?? ''),
    field('name', 3, product.name),
    field('brand', 2.4, product.brand),
    field('family', 1.5, `${FAMILY_NAMES[product.category] ?? product.category} ${product.category}`),
    field(
      'subtype',
      1.7,
      `${SUBTYPE_NAMES[product.subcategory] ?? product.subcategory} ${product.subcategory}`
    ),
    field('keySpecs', 1.3, product.keySpecs.join(' ')),
    field(
      'description',
      1,
      `${product.shortDescription} ${product.longDescription ?? ''}`
    ),
    field('specs', 0.85, specText),
  ];
}

/** Every category and sub-family, so "flood light" can answer with a family. */
export function categoryDocs(): CategoryDoc[] {
  const docs: CategoryDoc[] = [];
  for (const cat of CATEGORIES) {
    docs.push({
      slug: cat.slug,
      name: cat.name,
      navLabel: cat.navLabel,
      descriptor: cat.descriptor,
      href: `/shop/${cat.slug}`,
      kind: 'category',
      parentName: '',
    });
    for (const sub of cat.subcategories) {
      docs.push({
        slug: `${cat.slug}:${sub.label}`,
        name: sub.label,
        navLabel: sub.label,
        descriptor: cat.name,
        href: sub.href,
        kind: 'subcategory',
        parentName: cat.name,
      });
    }
  }
  return docs;
}

function categoryFields(doc: CategoryDoc): IndexedField[] {
  return [
    field('name', 2.6, `${doc.name} ${doc.navLabel}`),
    field('description', 1.2, `${doc.descriptor} ${doc.parentName}`),
  ];
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * The words a query is really asking about. Each word becomes a slot of
 * alternatives: the word itself plus the words a shopper might use for the
 * same thing.
 */
export function querySlots(query: string): { slots: string[][]; phrase: string } {
  const raw = tokenise(query);
  const slots = raw.map((token) => {
    const alternatives = [token];
    for (const synonym of WORD_SYNONYMS[token] ?? []) {
      if (!alternatives.includes(synonym)) alternatives.push(synonym);
    }
    return alternatives;
  });
  return { slots, phrase: normalise(query) };
}

/**
 * Rank products against a query. Products that match every word come first;
 * partial matches are kept but pushed down, so a near miss is still a result.
 */
export function rankProducts<T extends SearchableProduct>(
  products: T[],
  query: string
): SearchHit<T>[] {
  const { slots, phrase } = querySlots(query);
  if (slots.length === 0) return [];

  const hits: SearchHit<T>[] = [];
  for (const product of products) {
    const { score, fields, matchedTerms } = scoreDoc(productFields(product), slots, phrase);
    if (score <= 0) continue;

    let final = score;
    if (matchedTerms < slots.length) {
      // Not every word landed. Keep it, but rank it below the clean matches.
      final *= 0.4;
    }
    if (product.isFeatured) final += 1.5;
    if (product.stockStatus === 'in_stock') final += 1;
    if (product.retailPrice != null) final += 0.5;
    if (product.images.length > 0) final += 0.5;
    final -= Math.min(product.name.length, 120) / 1000;

    hits.push({
      item: product,
      score: final,
      fields: fields.map((f) => FIELD_LABELS[f] ?? f),
      matchedTerms,
    });
  }

  return hits.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
}

/** Rank families and sub-families against a query. */
export function rankCategories(query: string): SearchHit<CategoryDoc>[] {
  const { slots, phrase } = querySlots(query);
  if (slots.length === 0) return [];
  const hits: SearchHit<CategoryDoc>[] = [];
  for (const doc of categoryDocs()) {
    const { score, fields, matchedTerms } = scoreDoc(categoryFields(doc), slots, phrase);
    if (score <= 0) continue;
    const final = score * (matchedTerms < slots.length ? 0.4 : 1);
    hits.push({
      item: doc,
      score: final,
      fields: fields.map((f) => FIELD_LABELS[f] ?? f),
      matchedTerms,
    });
  }
  return hits.sort((a, b) => b.score - a.score);
}

/** The words to highlight in a result title. */
export function highlightTerms(query: string): string[] {
  const phrase = normalise(query);
  const words = phrase.split(' ').filter((w) => w.length >= 2);
  return words.length > 0 ? words : phrase ? [phrase] : [];
}
