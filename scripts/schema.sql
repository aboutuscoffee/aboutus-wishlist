-- 買ってほしい物リスト（aboutus-wishlist）
-- Supabase の SQL Editor で一度だけ実行してください。

create table if not exists wl_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                 -- 商品名
  purpose     text not null default '',      -- 用途（何に使うか）
  reason      text not null default '',      -- 目的（なぜ必要か）
  price       integer,                       -- 金額（1個あたり・税込）
  quantity    integer not null default 1,    -- 個数
  url         text not null default '',      -- 購入リンク
  urgent      boolean not null default false,-- 急ぎ
  status      text not null default 'requested' check (status in ('requested','bought')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  bought_at   timestamptz
);

alter table wl_items enable row level security;

drop policy if exists "wl_items anon all" on wl_items;
create policy "wl_items anon all" on wl_items
  for all to anon, authenticated using (true) with check (true);
