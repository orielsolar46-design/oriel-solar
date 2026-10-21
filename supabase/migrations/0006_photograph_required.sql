-- 0006 — a product with no photograph is not on the shop
--
-- WHY
--   Rows reached the database before they had a photograph. The Chloride Exide
--   July 2026 pricelist and the 4 August 2026 wholesale list were imported
--   straight into Supabase rather than through data/products.json, and the
--   wholesale import set is_published on all 37 rows whether or not a
--   photograph existed — so for two days the storefront showed "photograph
--   coming soon" on live, priced, buyable products (PHOTOGRAPHY-NEEDED.md).
--   A buyer cannot be sold something they cannot see, so from here a row with
--   an empty images array is not a shop item at all.
--
--   Two steps, in this order:
--     1. Unpublish every imageless product that is currently published, so the
--        back office shows the truth about what is live.
--     2. Rebuild products_public with the photograph rule in the view itself.
--        The view is the security boundary the storefront reads through, so
--        the rule holds even if a row is published again by accident — adding
--        the photograph is what brings it back.
--
-- HOW TO RUN
--   Supabase dashboard -> SQL Editor -> New query -> paste this whole file
--   -> Run. Safe to re-run: the update only matches imageless published rows
--   and the view is dropped before it is rebuilt.
--
--   Removal means UNPUBLISHED, not deleted. A product that was buyable while
--   imageless may already sit on an order, and an order history that cannot
--   name what was bought is worse than an unpublished row waiting for a photo.

update products
set is_published = false, updated_at = now()
where is_published = true
  and jsonb_array_length(images) = 0;

drop view if exists products_public;

create view products_public as
select
  id, slug, name, brand, model_code, category, subcategory,
  short_description, long_description, specs, key_specs, images,
  case when retail_price > 500000 then null else retail_price end as retail_price,
  (retail_price > 500000) as quote_only,
  case when retail_price > 500000 then null else price_per_watt end as price_per_watt,
  module_watts, warranty_years, stock_status, lead_time_days,
  weight_kg, requires_installation, compatible_with,
  annual_kwh_yield, datasheet_url, is_featured, seo_title, seo_description
from products
where is_published = true
  and retail_price is not null
  and jsonb_array_length(images) > 0;

-- The view stays the default (definer-rights) view and the browser roles are
-- granted access to IT, never to `products`. That asymmetry is the protection:
-- anon and authenticated read the safe columns through the view and cannot
-- reach cost_price at all, because `products` has no public select policy.
-- Do NOT add `security_invoker = on` here. Dropping the view dropped its
-- grants, so they are re-asserted here.
grant select on products_public to anon, authenticated;
