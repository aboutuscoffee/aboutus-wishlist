import { yen, subtotal, shortDate, hostOf } from '../lib/format.js';

export default function ItemCard({ item, onEdit, onBought, onRestore }) {
  const isBought = item.status === 'bought';
  return (
    <article className={`card${isBought ? ' done' : ''}`}>
      <div className="card-head">
        <h2>
          {item.urgent && !isBought && <span className="tag">至急</span>}
          {item.name}
        </h2>
        <span className="subtotal">{item.price == null ? '金額未定' : yen(subtotal(item))}</span>
      </div>

      <dl className="fields">
        <dt>用途</dt>
        <dd>{item.purpose || '—'}</dd>
        {item.reason && (
          <>
            <dt>備考</dt>
            <dd>{item.reason}</dd>
          </>
        )}
        <dt>単価・数量</dt>
        <dd>
          {yen(item.price)} × {item.quantity}
        </dd>
        <dt>登録日</dt>
        <dd>
          {shortDate(item.created_at)}
          {isBought && item.bought_at && `（${shortDate(item.bought_at)} 購入）`}
        </dd>
      </dl>

      <div className="card-actions">
        {item.url ? (
          <a className="item-link" href={item.url} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>
              購入先リンク
              <small>{hostOf(item.url)}</small>
            </span>
          </a>
        ) : (
          <span className="no-link">リンクなし</span>
        )}
        <label className={`order-check${isBought ? ' on' : ''}`}>
          <input type="checkbox" checked={isBought} onChange={isBought ? onRestore : onBought} />
          購入済み
        </label>
        <button className="btn text" onClick={onEdit}>編集</button>
      </div>
    </article>
  );
}
