-- 買ってほしい物リスト：iPhoneアイコンのバッジ（プッシュ通知）用
-- Supabase の SQL Editor で一度だけ実行してください。

create table if not exists wl_push_subs (
  endpoint     text primary key,
  p256dh       text not null,
  auth         text not null,
  last_seen_at timestamptz not null default now(), -- この端末で最後にリストを開いた時刻（バッジの数の基準）
  created_at   timestamptz not null default now()
);

alter table wl_push_subs enable row level security;

drop policy if exists "wl_push_subs anon all" on wl_push_subs;
create policy "wl_push_subs anon all" on wl_push_subs
  for all to anon, authenticated using (true) with check (true);
