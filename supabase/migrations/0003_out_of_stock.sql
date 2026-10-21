-- ---------------------------------------------------------------------------
-- 0003 — an explicit out-of-stock state
--
-- HOW TO RUN
--   Supabase dashboard -> SQL Editor -> New query -> paste this file -> Run.
--   Safe to re-run: the value is only added when it is missing.
--
--   Unlike 0001, this migration drops nothing and touches no data. It is safe
--   against a database holding real orders.
--
-- WHY
--   The storefront used to print the stock state on every card — "In stock",
--   "Call for availability". A buyer who reads "Call for availability" tends
--   to leave rather than call, so those labels are gone.
--
--   What replaces them is a single state a customer does need to know about:
--   the item cannot be bought right now. `out_of_stock` products stay visible
--   and indexed, with the card dimmed, an "Out of stock" marker, and the
--   basket button replaced by a way to reach a person. The other four states
--   are stock bookkeeping for the admin and are never shown.
--
--   products_public already selects stock_status and filters only on
--   is_published and retail_price, so no view change is needed — an
--   out-of-stock product keeps its page, its URL and its search ranking.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'stock_status'
      and e.enumlabel = 'out_of_stock'
  ) then
    alter type stock_status add value 'out_of_stock';
  end if;
end
$$;
