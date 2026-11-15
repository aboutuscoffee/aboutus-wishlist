import { useEffect, useMemo, useState } from 'react';
import { fetchItems, createItem, updateItem, deleteItem } from './lib/db.js';
import { yen, subtotal } from './lib/format.js';
import ItemCard from './components/ItemCard.jsx';
import ItemSheet from './components/ItemSheet.jsx';

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null=閉, {}=新規, item=編集
  const [showBought, setShowBought] = useState(false);
  const [toast, setToast] = useState(null);

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
    const onVisible = () => document.visibilityState === 'visible' && load();
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
      const saved = editing?.id ? await updateItem(editing.id, fields) : await createItem(fields);
      replace(saved);
      setEditing(null);
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
        <div>
          <p className="eyebrow">Wish list</p>
          <h1>買ってほしい物リスト</h1>
        </div>
      </header>

      <section className="summary">
        <div>
          <span className="label">お願い中</span>
          <span className="num">{requested.length}</span>
          <span className="unit">件</span>
        </div>
        <div>
          <span className="label">合計</span>
          <span className="num">{yen(total)}</span>
          {hasUnpriced && <span className="unit">＋金額未定あり</span>}
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
            <div className="state">今お願いしている物はありません</div>
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
                購入済み {bought.length}件 {showBought ? '▲' : '▼'}
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

      <button className="fab" onClick={() => setEditing({})}>＋ 追加</button>

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
