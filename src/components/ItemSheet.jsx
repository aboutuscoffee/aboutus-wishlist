import { useState } from 'react';
import Sheet from './Sheet.jsx';

export default function ItemSheet({ item, onClose, onSave, onDelete }) {
  const isNew = !item.id;
  const [name, setName] = useState(item.name || '');
  const [purpose, setPurpose] = useState(item.purpose || '');
  const [reason, setReason] = useState(item.reason || '');
  const [price, setPrice] = useState(item.price ?? '');
  const [quantity, setQuantity] = useState(item.quantity ?? 1);
  const [url, setUrl] = useState(item.url || '');
  const [urgent, setUrgent] = useState(!!item.urgent);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    const p = String(price).replace(/[^\d]/g, '');
    await onSave({
      name: name.trim(),
      purpose: purpose.trim(),
      reason: reason.trim(),
      price: p === '' ? null : Number(p),
      quantity: Math.max(1, Number(quantity) || 1),
      url: url.trim(),
      urgent,
    });
    setSaving(false);
  }

  return (
    <Sheet title={isNew ? '新規登録' : '編集'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          商品名
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          用途
          <textarea rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </label>
        <label>
          備考
          <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className="row2">
          <label>
            <span>単価 <small>税込・未定は空欄</small></span>
            <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
          </label>
          <label>
            個数
            <input type="number" min="1" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
        </div>
        <label>
          購入リンク
          <input type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </label>
        <label className="check">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          至急
        </label>

        <button className="btn primary block" type="submit" disabled={!name.trim() || saving}>
          {saving ? '保存中…' : isNew ? '追加する' : '保存する'}
        </button>

        {!isNew &&
          (confirmDelete ? (
            <div className="confirm">
              <span>本当に削除しますか？</span>
              <button type="button" className="btn danger" onClick={() => onDelete(item)}>削除する</button>
              <button type="button" className="btn ghost" onClick={() => setConfirmDelete(false)}>やめる</button>
            </div>
          ) : (
            <button type="button" className="btn ghost" onClick={() => setConfirmDelete(true)}>この項目を削除</button>
          ))}
      </form>
    </Sheet>
  );
}
