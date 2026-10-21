import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase clients. Server-only by design.
 *
 * `publicClient` uses the anon key and is bound by Row Level Security — it can
 * read the products_public view, categories, brands and published content, and
 * nothing else. It is what the storefront uses.
 *
 * `serviceClient` uses the service role key, which BYPASSES RLS entirely. It is
 * for order creation, payment records and the admin dashboard. It must never be
 * reachable from a client component; the `server-only` import above turns any
 * such import into a build error rather than a silent leak.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && serviceKey);
}

function requireConfig(): { url: string; anonKey: string; serviceKey: string } {
  if (!url || !anonKey || !serviceKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
  return { url, anonKey, serviceKey };
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };

/**
 * Row typing. Generated types (`supabase gen types typescript`) need the
 * Supabase CLI linked to the project with an access token, which we do not
 * have yet, so the client is created with a permissive schema generic. Column
 * names are still checked by hand against supabase/migrations/*.sql, and the
 * mapping layers in lib/catalogue.ts and lib/orders/store.ts convert rows into
 * strongly typed application objects — so the untyped surface is confined to
 * this file's boundary. Logged in DECISIONS.md as a follow-up.
 */
/* eslint-disable-next-line */
type PermissiveSchema = any;

let publicSingleton: SupabaseClient<PermissiveSchema> | null = null;
let serviceSingleton: SupabaseClient<PermissiveSchema> | null = null;

/**
 * Cache tag for everything catalogue-shaped. Marking a product out of stock in
 * the admin has to reach the shop, and by default Next caches every fetch a
 * server component makes — including Supabase's — indefinitely. Without this
 * tag the change lands in the database and the storefront keeps serving the
 * old answer until the next deploy, which is the worst kind of bug: the admin
 * says it worked, and it did, and the customer still cannot see it.
 */
export const CATALOGUE_TAG = 'catalogue';

/** RLS-bound reads for the storefront. Cached, and tagged so admin edits can bust it. */
export function publicClient(): SupabaseClient<PermissiveSchema> {
  if (!publicSingleton) {
    const config = requireConfig();
    publicSingleton = createClient<PermissiveSchema>(config.url, config.anonKey, {
      ...options,
      global: {
        fetch: (input, init) =>
          fetch(input as RequestInfo, {
            ...init,
            // An hour is the backstop; admin writes revalidate this tag
            // immediately, so the hour only matters if something is changed
            // directly in the Supabase dashboard.
            next: { tags: [CATALOGUE_TAG], revalidate: 3600 },
          }),
      },
    });
  }
  return publicSingleton;
}

/**
 * Public catalogue reads used while money is about to move. These must never
 * reuse a cached response: an admin price change has to be the price shown at
 * checkout and the price recorded on the order immediately.
 */
export function currentPublicClient(): SupabaseClient<PermissiveSchema> {
  const config = requireConfig();
  return createClient<PermissiveSchema>(config.url, config.anonKey, {
    ...options,
    global: {
      fetch: (input, init) => fetch(input as RequestInfo, { ...init, cache: 'no-store' }),
    },
  });
}

/**
 * Full access. Orders, payments, admin. Never import from a client component.
 *
 * Never cached: an admin reading stock levels must see the database as it is
 * this second, not as it was when the cache filled.
 */
export function serviceClient(): SupabaseClient<PermissiveSchema> {
  if (!serviceSingleton) {
    const config = requireConfig();
    serviceSingleton = createClient<PermissiveSchema>(config.url, config.serviceKey, {
      ...options,
      global: {
        fetch: (input, init) =>
          fetch(input as RequestInfo, { ...init, cache: 'no-store' }),
      },
    });
  }
  return serviceSingleton;
}
