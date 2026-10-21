-- Web push subscriptions for the back-office app.
--
-- One row per device the owner has installed the app on and allowed
-- notifications for. He is expected to have two — a phone and maybe a tablet —
-- so this table stays tiny, and it is keyed by the endpoint because that is
-- what the browser hands us and what uniquely identifies a device+browser pair.
--
-- Rows are removed by the sender, not by the client: when a push returns 404 or
-- 410 the subscription is dead (app uninstalled, permission revoked, browser
-- data cleared) and keeping it only produces failing sends forever.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  -- Free-text note so a person can tell "Denis's phone" from a stale row.
  label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists push_subscriptions_created_idx
  on push_subscriptions (created_at desc);

-- Staff-only data. No anon or authenticated access whatsoever: every read and
-- write goes through the service role from the server, the same way order
-- mutations do. RLS on with no policy means nothing gets in by the front door.
alter table push_subscriptions enable row level security;
