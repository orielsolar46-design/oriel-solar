-- Oriel Power — schema, pricing view and RLS
-- All writes are service-role or staff; the storefront reads only the
-- products_public view, which never exposes cost or dealer pricing.
--
-- HOW TO RUN THIS
--   Supabase dashboard -> SQL Editor -> New query -> paste this whole file
--   -> Run. It is safe to re-run: everything is dropped first, so a partial
--   failure can be corrected and the file run again from the top.
--
--   WARNING: the drops below delete these tables and their data. That is what
--   you want on a fresh project. Do NOT re-run this against a database that
--   already holds real orders.

drop view if exists products_public;
drop table if exists order_events, order_items, payments, mpesa_logs,
  quote_requests, contact_messages, calculator_leads, blog_posts, projects,
  staff_profiles, orders, products, categories, brands cascade;
drop sequence if exists order_number_seq;
drop function if exists compute_retail_price(numeric, boolean, numeric);
drop function if exists next_order_number();
drop function if exists enforce_cod_paid_before_delivered() cascade;
drop function if exists is_staff();
drop type if exists stock_status, price_status, order_status, payment_status,
  quote_status, staff_role cascade;

create type stock_status as enum ('in_stock', 'low_stock', 'on_order', 'call_for_stock');
create type price_status as enum ('ok', 'needs_review');
create type order_status as enum (
  'pending_payment', 'paid', 'payment_failed', 'pending_cod',
  'processing', 'out_for_delivery', 'delivered', 'cancelled', 'refunded');
create type payment_status as enum ('initiated', 'paid', 'failed', 'cancelled');
create type quote_status as enum ('new', 'contacted', 'quoted', 'won', 'lost');
create type staff_role as enum ('admin', 'staff');

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table categories (
  id text primary key,               -- slug, e.g. 'solar-panels'
  name text not null,
  descriptor text,                   -- one-line menu descriptor
  intro text,                        -- category page introduction
  sort_order int not null default 0
);

create table brands (
  id text primary key,               -- slug
  name text not null,
  logo_url text
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text references brands(id),
  model_code text,
  category text not null references categories(id),
  subcategory text,
  short_description text not null,
  long_description text,
  specs jsonb not null default '[]',           -- [{group,label,value,unit}]
  key_specs text[] not null default '{}',
  images jsonb not null default '[]',          -- [{url,alt,type}]
  -- Pricing. cost_price is INTERNAL and is excluded from products_public.
  cost_price numeric(12,2),
  cost_per_watt numeric(8,2),
  module_watts int,
  markup_percent_override numeric(6,2),        -- admin per-product override
  retail_price numeric(12,2),                  -- computed by compute_retail_price()
  price_status price_status not null default 'ok',
  source_vat_inclusive boolean,                -- null = source did not state
  pricing_note text,                           -- internal note, never public
  price_per_watt numeric(8,2),                 -- retail display, panels only
  warranty_years numeric(4,1),
  stock_status stock_status not null default 'call_for_stock',
  stock_qty int,
  lead_time_days int,
  weight_kg numeric(8,2),
  dimensions_mm text,
  requires_installation boolean not null default true,
  compatible_with text[] not null default '{}',  -- product slugs, curated
  annual_kwh_yield numeric(10,2),
  datasheet_url text,
  source_supplier text not null,
  source_list_date text not null,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on products (category, is_published);
create index products_brand_idx on products (brand);

-- Retail derivation: cost x (1 + markup/100), normalised to VAT-inclusive,
-- rounded UP to the nearest KES 100. Sources that are VAT-exclusive gain 16%;
-- sources already inclusive pass through. Unstated VAT stays needs_review and
-- returns null so nothing unverified is ever published.
create or replace function compute_retail_price(
  p_cost numeric, p_vat_inclusive boolean, p_markup_percent numeric
) returns numeric language sql immutable as $$
  select case
    when p_cost is null or p_markup_percent is null or p_vat_inclusive is null then null
    else ceil((p_cost * (1 + p_markup_percent / 100.0)
               * case when p_vat_inclusive then 1 else 1.16 end) / 100.0) * 100
  end
$$;

-- Public storefront surface. cost_price, cost_per_watt, markup and pricing
-- notes never appear here. Quote-tier items (retail > 500,000) expose no price.
create view products_public as
select
  id, slug, name, brand, model_code, category, subcategory,
  short_description, long_description, specs, key_specs, images,
  case when retail_price > 500000 then null else retail_price end as retail_price,
  (retail_price > 500000) as quote_only,
  case when retail_price > 500000 then null else price_per_watt end as price_per_watt,
  module_watts, warranty_years, stock_status, lead_time_days,
  weight_kg, dimensions_mm, requires_installation, compatible_with,
  annual_kwh_yield, datasheet_url, is_featured, seo_title, seo_description
from products
where is_published = true and retail_price is not null;

-- The view is intentionally left as the default (definer-rights) view and the
-- browser roles are granted access to IT, never to `products`. That asymmetry
-- is the protection: anon and authenticated can read the safe columns through
-- the view, and cannot reach cost_price at all, because `products` has no
-- public select policy. Do NOT add `security_invoker = on` here — that would
-- force us to give anon a policy on `products` itself, which is exactly what
-- must not happen.
grant select on products_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Commerce
-- ---------------------------------------------------------------------------
create sequence order_number_seq;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,           -- ORL-{YYMM}-{5-digit}
  status order_status not null default 'pending_payment',
  access_token uuid not null default gen_random_uuid(),  -- guards /order/[orderNumber]
  customer_name text not null,
  phone text not null,                         -- normalised 2547XXXXXXXX / 2541XXXXXXXX
  email text,
  county text not null,
  town text,
  delivery_notes text,
  is_business boolean not null default false,
  company_name text,
  kra_pin text,
  delivery_method text not null,               -- 'delivery' | 'collection'
  delivery_zone text,
  delivery_fee numeric(12,2) not null default 0,
  installation_fee numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null,             -- server-recalculated, never client
  total numeric(12,2) not null,
  payment_option text not null,                -- 'pay_now' | 'pay_on_delivery'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function next_order_number() returns text language sql volatile as $$
  select 'ORL-' || to_char(now(), 'YYMM') || '-' ||
         lpad(nextval('order_number_seq')::text, 5, '0')
$$;

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name text not null,                  -- snapshot at purchase
  model_code text,
  unit_price numeric(12,2) not null,           -- snapshot, VAT-inclusive retail
  quantity int not null check (quantity > 0),
  with_installation boolean not null default false
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  status payment_status not null default 'initiated',
  amount numeric(12,2) not null,
  phone text not null,
  checkout_request_id text unique,             -- idempotency: duplicate callbacks ignored
  merchant_request_id text,
  mpesa_receipt text,
  transaction_date timestamptz,
  result_code int,
  result_desc text,
  amount_change_reason text,                   -- mandatory when COD amount edited down
  created_at timestamptz not null default now()
);

create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  actor text not null,                         -- 'customer' | 'system' | staff email
  event text not null,
  note text,
  created_at timestamptz not null default now()
);

-- A COD order can never be delivered without a paid payment row. DB-enforced.
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

create trigger cod_paid_before_delivered
  before update of status on orders
  for each row execute function enforce_cod_paid_before_delivered();

create table mpesa_logs (
  id uuid primary key default gen_random_uuid(),
  direction text not null,                     -- 'request' | 'response' | 'callback'
  endpoint text not null,
  order_id uuid references orders(id),
  payload jsonb not null,                      -- secrets redacted before insert
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Leads and content
-- ---------------------------------------------------------------------------
create table quote_requests (
  id uuid primary key default gen_random_uuid(),
  status quote_status not null default 'new',
  name text not null,
  phone text not null,
  email text,
  county text,
  product_slug text,
  message text,
  notes jsonb not null default '[]',           -- staff note thread
  created_at timestamptz not null default now()
);

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  county text,
  need text,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table calculator_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  inputs jsonb not null,
  recommendation jsonb not null,
  created_at timestamptz not null default now()
);

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null,
  cover_image text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  county text,
  system_size text,
  summary text,
  body text,
  images jsonb not null default '[]',
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role staff_role not null default 'staff',
  full_name text
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table categories enable row level security;
alter table brands enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table order_events enable row level security;
alter table mpesa_logs enable row level security;
alter table quote_requests enable row level security;
alter table contact_messages enable row level security;
alter table calculator_leads enable row level security;
alter table blog_posts enable row level security;
alter table projects enable row level security;
alter table staff_profiles enable row level security;

create or replace function is_staff() returns boolean language sql stable as $$
  select exists (select 1 from staff_profiles where id = auth.uid())
$$;

-- Public reads: reference data and published content only. The products table
-- itself has NO public select policy — the storefront queries products_public
-- via the server with the service role, so cost_price never crosses the wire.
create policy "public read categories" on categories for select using (true);
create policy "public read brands" on brands for select using (true);
create policy "public read published posts" on blog_posts for select using (is_published = true);
create policy "public read published projects" on projects for select using (is_published = true);

-- Explicit grants for the browser roles. Policies decide WHICH rows; grants
-- decide whether the role may touch the table at all — both are needed.
-- `products` is deliberately absent: the browser reaches catalogue data only
-- through products_public, which has no cost column.
grant select on categories, brands, blog_posts, projects to anon, authenticated;

-- Staff read/write everything they operate on.
create policy "staff all products" on products for all using (is_staff());
create policy "staff all categories" on categories for all using (is_staff());
create policy "staff all brands" on brands for all using (is_staff());
create policy "staff all orders" on orders for all using (is_staff());
create policy "staff all order_items" on order_items for all using (is_staff());
create policy "staff all payments" on payments for all using (is_staff());
create policy "staff all order_events" on order_events for all using (is_staff());
create policy "staff read mpesa_logs" on mpesa_logs for select using (is_staff());
create policy "staff all quote_requests" on quote_requests for all using (is_staff());
create policy "staff all contact_messages" on contact_messages for all using (is_staff());
create policy "staff read calculator_leads" on calculator_leads for select using (is_staff());
create policy "staff all blog_posts" on blog_posts for all using (is_staff());
create policy "staff all projects" on projects for all using (is_staff());
create policy "staff read own profile" on staff_profiles for select using (id = auth.uid());
