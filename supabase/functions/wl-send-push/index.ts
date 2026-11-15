// 買ってほしい物リスト：新しい物が登録されたら、通知をオンにした端末へプッシュを送り、
// アイコンのバッジに「前回開いてから増えた未購入の件数」を出す。
// 鍵は staff-todo と同じ VAPID（Supabase の Edge Function Secrets に登録済み）を使う。
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("STAFF_TODO_VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("STAFF_TODO_VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("STAFF_TODO_VAPID_SUBJECT")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // name: 登録された商品名 / exclude: 登録した本人の端末（自分には送らない）
  const { name, exclude } = await req.json().catch(() => ({}));

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: subs, error } = await supabase.from("wl_push_subs").select("*");
  if (error) return json({ error: error.message }, 500);

  const targets = (subs ?? []).filter((s) => s.endpoint !== exclude);
  const results = await Promise.allSettled(
    targets.map(async (s) => {
      const { count } = await supabase
        .from("wl_items")
        .select("id", { count: "exact", head: true })
        .eq("status", "requested")
        .gt("created_at", s.last_seen_at);
      const payload = JSON.stringify({
        title: "買ってほしい物リスト",
        body: name ? `新しく登録されました：${name}` : "新しく登録されました",
        badge: count ?? 0,
      });
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      } catch (e) {
        // 通知をやめた端末・アプリを消した端末は登録を消す
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await supabase.from("wl_push_subs").delete().eq("endpoint", s.endpoint);
        throw e;
      }
    })
  );

  return json({
    attempted: results.length,
    succeeded: results.filter((r) => r.status === "fulfilled").length,
    errors: results.flatMap((r) =>
      r.status === "rejected" ? [String((r.reason as any)?.body || (r.reason as any)?.message || r.reason)] : []
    ),
  });
});
