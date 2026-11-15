import { useEffect, useMemo, useState } from 'react';
import { fetchItems, createItem, updateItem, deleteItem } from './lib/db.js';
import { yen, subtotal } from './lib/format.js';
import ItemCard from './components/ItemCard.jsx';
import ItemSheet from './components/ItemSheet.jsx';
import { pushSupported, isStandalone, currentSubscription, enablePush, markSeen, notifyNewItem } from './lib/push.js';

// アイコンのバッジ（プッシュ通知）は保留中。wl_push_subs のSQL実行と wl-send-push の公開が済んだら true にする
const PUSH_READY = false;

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null=閉, {}=新規, item=編集
  const [showBought, setShowBought] = useState(false);
  const [toast, setToast] = useState(null);
  // 通知（アイコンのバッジ）の状態: on / off / need-home（ホーム画面に追加が必要）/ none（非対応）
  const [push, setPush] = useState('none');

  async function refreshPush() {
    if (pushSupported() && isStandalone()) {
      setPush((await currentSubscription().catch(() => null)) ? 'on' : 'off');
    } else if (/iPhone|iPad/.test(navigator.userAgent)) {
      setPush('need-home');
    } else {
      setPush('none');
    }
  }

  async function turnOnPush() {
    try {
      await enablePush();
      setPush('on');
      setToast({ text: '通知をオンにしました。新しい登録がアイコンに数字で表示されます' });
    } catch (e) {
      setToast({ text: e.message });
    }
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchItems());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    markSeen();
    refreshPush();
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      load();
      markSeen();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const requested = useMemo(
    () =>
      items
        .filter((i) => i.status === 'requested')
        .sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.created_at.localeCompare(a.created_at)),
    [items]
  );
  const bought = useMemo(
    () =>
      items
        .filter((i) => i.status === 'bought')
        .sort((a, b) => (b.bought_at || '').localeCompare(a.bought_at || '')),
    [items]
  );
  const total = requested.reduce((s, i) => s + (subtotal(i) || 0), 0);
  const hasUnpriced = requested.some((i) => i.price == null);

  function replace(item) {
    setItems((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      return exists ? prev.map((p) => (p.id === item.id ? item : p)) : [item, ...prev];
    });
  }

  async function run(fn) {
    try {
      await fn();
    } catch (e) {
      setToast({ text: `保存できませんでした：${e.message}` });
    }
  }

  const save = (fields) =>
    run(async () => {
      const isNew = !editing?.id;
      const saved = isNew ? await createItem(fields) : await updateItem(editing.id, fields);
      replace(saved);
      setEditing(null);
      if (isNew && PUSH_READY) notifyNewItem(saved.name);
    });

  const setStatus = (item, status) =>
    run(async () => {
      const saved = await updateItem(item.id, {
        status,
        bought_at: status === 'bought' ? new Date().toISOString() : null,
      });
      replace(saved);
      if (status === 'bought') {
        setToast({ text: `「${item.name}」を購入済みにしました`, undo: () => setStatus(saved, 'requested') });
      }
    });

  const remove = (item) =>
    run(async () => {
      await deleteItem(item.id);
      setItems((prev) => prev.filter((p) => p.id !== item.id));
      setEditing(null);
    });

  return (
    <div className="app">
      <header>
        <h1>買ってほしい物リスト</h1>
        <button className="btn primary" onClick={() => setEditing({})}>新規登録</button>
      </header>

      <section className="summary">
        <div>
          <span className="label">未購入</span>
          <span className="num">{requested.length}件</span>
        </div>
        <div>
          <span className="label">合計金額（税込）</span>
          <span className="num">
            {yen(total)}
            {hasUnpriced && <small>＋金額未定あり</small>}
          </span>
        </div>
      </section>

      {loading && items.length === 0 ? (
        <div className="state">読み込み中…</div>
      ) : error ? (
        <div className="state">
          <p>読み込めませんでした：{error}</p>
          <button className="btn" onClick={load}>もう一度読み込む</button>
        </div>
      ) : (
        <>
          {requested.length === 0 ? (
            <div className="state">未購入の物はありません</div>
          ) : (
            <div className="cards">
              {requested.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => setEditing(item)}
                  onBought={() => setStatus(item, 'bought')}
                />
              ))}
            </div>
          )}

          {bought.length > 0 && (
            <section className="bought">
              <button className="bought-toggle" onClick={() => setShowBought((v) => !v)}>
                <span>購入済み（{bought.length}件）</span>
                <span>{showBought ? '閉じる' : '表示'}</span>
              </button>
              {showBought && (
                <div className="cards">
                  {bought.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onEdit={() => setEditing(item)}
                      onRestore={() => setStatus(item, 'requested')}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {PUSH_READY && <footer className="push-note">
        {push === 'off' && (
          <button className="btn" onClick={turnOnPush}>新しい登録をアイコンの数字で知らせる（通知をオン）</button>
        )}
        {push === 'on' && <p>通知オン：新しい登録はアイコンに数字で表示されます</p>}
        {push === 'need-home' && (
          <p>共有ボタン →「ホーム画面に追加」から開くと、新しい登録をアイコンの数字で知らせる設定ができます</p>
        )}
      </footer>}

      {editing && (
        <ItemSheet item={editing} onClose={() => setEditing(null)} onSave={save} onDelete={remove} />
      )}

      {toast && (
        <div className="toast">
          <span>{toast.text}</span>
          {toast.undo && (
            <button
              onClick={() => {
                toast.undo();
                setToast(null);
              }}
            >
              元に戻す
            </button>
          )}
        </div>
      )}
    </div>
  );
}
