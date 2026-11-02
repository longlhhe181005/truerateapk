// Vietnamese number formatting without relying on Intl (works the same on Hermes and web).

const group = (intStr) => intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** 5000000 -> "5.000.000đ" */
export const vnd = (v) => `${v < 0 ? '-' : ''}${group(String(Math.abs(Math.round(v || 0))))}đ`;

/** 1385.94 -> "1.386", 23.456 -> "23,5" (one decimal under 100, or `digits` for small reference rates) */
export function percent(v, digits = 1) {
  if (v >= 100) return group(String(Math.round(v)));
  const [i, d] = v.toFixed(digits).split('.');
  const decimals = d.replace(/0+$/, '');
  return decimals ? `${group(i)},${decimals}` : group(i);
}

/** Text typed in a money field -> digits grouped with dots, e.g. "5000000" -> "5.000.000". */
export const formatMoneyInput = (text) => {
  const digits = String(text ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  return digits ? group(digits) : '';
};

/** "5.000.000" -> 5000000, "" -> null */
export const parseMoney = (text) => {
  const digits = String(text ?? '').replace(/\D/g, '');
  return digits ? Number(digits) : null;
};

/** "18,5" or "18.5" -> 18.5, "" -> null */
export const parseDecimal = (text) => {
  const t = String(text ?? '').trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
};
