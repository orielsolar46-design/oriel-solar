-- Aligns the commerce tables with what the application actually stores.
-- Safe to run: it only touches orders/order_items/payments, which are empty
-- until the first real order. The catalogue is untouched.
--
-- Run in: Supabase dashboard -> SQL Editor -> paste -> Run.

-- 1. Order items reference a product SLUG, not a foreign key.
--    An order is a historical record: it must survive a product being
--    unpublished, renamed or deleted from the catalogue. Price and name are
--    already snapshotted on the row for the same reason.
alter table order_items drop constraint if exists order_items_product_id_fkey;
alter table order_items drop column if exists product_id;
alter table order_items add column if not exists product_slug text not null default '';
alter table order_items alter column product_slug drop default;

-- 2. Delivery fee is NULLABLE.
--    null means "priced per zone, confirmed with the customer before
--    dispatch" — which is the truth until {{DELIVERY_RATE_CARD}} is agreed.
--    Storing 0 would silently under-charge; storing null keeps it honest.
alter table orders alter column delivery_fee drop not null;
alter table orders alter column delivery_fee drop default;

-- 3. Installation is a request at checkout, not a fee we can compute yet.
alter table orders drop column if exists installation_fee;
alter table orders add column if not exists installation_requested boolean not null default false;

-- 4. Payments record WHO triggered them — 'customer' or 'staff' — so the
--    pay-on-delivery audit trail shows who took the money at the gate.
alter table payments add column if not exists actor text;

-- 5. Let PostgREST expose the order-number generator to the service role.
grant execute on function next_order_number() to service_role;

-- 6. Re-assert the COD guarantee against the aligned table. A
--    pay_on_delivery order can never reach 'delivered' without a paid
--    payment row — enforced here in the database, not only in application
--    code, exactly as the brief requires.
create or replace function enforce_cod_paid_before_delivered()
returns trigger language plpgsql as $$
begin
  if new.status = 'delivered' and new.payment_option = 'pay_on_delivery' then
    if not exists (
      select 1 from payments
      where order_id = new.id and status = 'paid'
    ) then
      raise exception 'COD order % cannot be delivered without a paid payment', new.order_number;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists cod_paid_before_delivered on orders;
create trigger cod_paid_before_delivered
  before update of status on orders
  for each row execute function enforce_cod_paid_before_delivered();
