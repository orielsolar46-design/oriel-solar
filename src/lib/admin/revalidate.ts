import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CATALOGUE_TAG } from '@/lib/supabase';

/**
 * Push a catalogue change out to the storefront immediately.
 *
 * Two separate caches have to be cleared, and clearing only one is why this
 * looked like it worked but did not:
 *
 *  - the Data Cache holds the Supabase response. `revalidateTag` drops it.
 *  - product pages are prerendered by generateStaticParams, so the rendered
 *    HTML survives even after the data behind it changes. `revalidatePath`
 *    drops that.
 *
 * The home page and category listings show products too, so they go as well.
 * This is cheap — it marks entries stale rather than rebuilding anything, and
 * the next visitor pays a single re-render.
 */
export function revalidateCatalogue(product?: { category: string; slug: string }) {
  revalidateTag(CATALOGUE_TAG);
  revalidatePath('/');
  revalidatePath('/shop');
  if (product) {
    revalidatePath(`/shop/${product.category}`);
    revalidatePath(`/shop/${product.category}/${product.slug}`);
  } else {
    // Category unknown (bulk edit): sweep the whole shop subtree.
    revalidatePath('/shop/[category]', 'page');
    revalidatePath('/shop/[category]/[product]', 'page');
  }
}
