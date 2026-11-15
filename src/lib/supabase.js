import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Supabase 環境変数が設定されていません。.env を確認してください。');
}

// 同じオリジンの他アプリとセッションが混ざって RLS エラーになるのを防ぐ
export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (u, o = {}) => fetch(u, { ...o, cache: 'no-store' }) },
});
