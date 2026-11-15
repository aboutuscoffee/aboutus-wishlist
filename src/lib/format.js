export const yen = (n) => (n == null ? '—' : `¥${Number(n).toLocaleString('ja-JP')}`);

export const subtotal = (item) => (item.price == null ? null : item.price * (item.quantity || 1));

export function shortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
