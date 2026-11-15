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
    <Sheet title={isNew ? '買ってほしい物を追加' : '編集'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          商品名
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：ドリップケトル" required />
        </label>
        <label>
          <span>用途 <small>何に使うか</small></span>
          <textarea rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="例：ハンドドリップの抽出" />
        </label>
        <label>
          <span>目的 <small>なぜ必要か・買うと何が良くなるか</small></span>
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="例：今のケトルは注ぎ口が太く湯量が安定しない。味のブレを減らしたい" />
        </label>
        <div className="row2">
          <label>
            <span>金額 <small>1個・税込</small></span>
            <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="未定なら空欄" />
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
          急ぎ（一番上に表示）
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
