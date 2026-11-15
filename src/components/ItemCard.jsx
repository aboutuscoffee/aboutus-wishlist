import { yen, subtotal, shortDate, hostOf } from '../lib/format.js';

export default function ItemCard({ item, onEdit, onBought, onRestore }) {
  const isBought = item.status === 'bought';
  return (
    <article className={`card${isBought ? ' done' : ''}${item.urgent && !isBought ? ' urgent' : ''}`}>
      <div className="card-head">
        <h2>
          {item.urgent && !isBought && <span className="badge">急ぎ</span>}
          {item.name}
        </h2>
        <button className="edit" onClick={onEdit}>編集</button>
      </div>

      <dl className="fields">
        {item.purpose && (
          <>
            <dt>用途</dt>
            <dd>{item.purpose}</dd>
          </>
        )}
        {item.reason && (
          <>
            <dt>目的</dt>
            <dd>{item.reason}</dd>
          </>
        )}
      </dl>

      <div className="price-row">
        <span>
          {yen(item.price)} × {item.quantity}個
        </span>
        <span className="subtotal">{item.price == null ? '金額未定' : yen(subtotal(item))}</span>
      </div>

      <div className="card-actions">
        {item.url ? (
          <a className="btn link" href={item.url} target="_blank" rel="noopener noreferrer">
            商品ページを開く<small>{hostOf(item.url)}</small>
          </a>
        ) : (
          <span className="no-link">リンクなし</span>
        )}
        {onBought && (
          <button className="btn primary" onClick={onBought}>購入済みにする</button>
        )}
        {onRestore && (
          <button className="btn" onClick={onRestore}>お願い中に戻す</button>
        )}
      </div>

      <p className="meta">
        {shortDate(item.created_at)} 追加
        {isBought && item.bought_at && `・${shortDate(item.bought_at)} 購入`}
      </p>
    </article>
  );
}
