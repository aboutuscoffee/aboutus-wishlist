import { supabase } from './supabase.js';

// staff-todo と同じ公開鍵（公開してよい値）
const VAPID_PUBLIC_KEY = 'BAQN-O-yquhnQil2yC-K3McU1TGyeQDyWmTt-ONHy-Ez_DXXRz7p7q8CpwU5FpwPOK9q_YP4CJ_XgzRTvVZJZME';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from([...atob(base64)].map((c) => c.charCodeAt(0)));
}

export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// iPhoneはホーム画面に追加したアプリとして開いたときだけ通知・バッジが使える
export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration('/aboutus-wishlist/');
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function enablePush() {
  if (!pushSupported()) throw new Error('この画面では通知が使えません');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('通知が許可されませんでした（設定アプリの通知から許可できます）');
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
  const j = sub.toJSON();
  const { error } = await supabase
    .from('wl_push_subs')
    .upsert(
      { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, last_seen_at: new Date().toISOString() },
      { onConflict: 'endpoint' }
    );
  if (error) throw new Error(error.message);
  return sub;
}

// リストを開いたらバッジを消し、この端末の「見た時刻」を今にする
export async function markSeen() {
  try {
    navigator.clearAppBadge?.();
  } catch {
    /* 対応していない端末では何もしない */
  }
  const sub = await currentSubscription().catch(() => null);
  if (!sub) return;
  await supabase.from('wl_push_subs').update({ last_seen_at: new Date().toISOString() }).eq('endpoint', sub.endpoint);
}

// 新しく登録したことを、通知をオンにしている他の端末へ知らせる
export async function notifyNewItem(name) {
  const sub = await currentSubscription().catch(() => null);
  const { error } = await supabase.functions.invoke('wl-send-push', {
    body: { name, exclude: sub?.endpoint || null },
  });
  if (error) console.warn('通知を送れませんでした', error.message);
}
