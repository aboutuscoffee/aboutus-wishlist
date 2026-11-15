import { yen, subtotal, shortDate } from '../lib/format.js';

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
          {isBought && item.bought_at && `（${shortDate(item.bought_at)} 発注）`}
        </dd>
      </dl>

      <div className="card-actions">
        {item.url ? (
          <a className="btn" href={item.url} target="_blank" rel="noopener noreferrer">商品ページ</a>
        ) : (
          <span className="btn disabled">リンクなし</span>
        )}
        <label className={`order-check${isBought ? ' on' : ''}`}>
          <input type="checkbox" checked={isBought} onChange={isBought ? onRestore : onBought} />
          発注済み
        </label>
        <button className="btn text" onClick={onEdit}>編集</button>
      </div>
    </article>
  );
}
