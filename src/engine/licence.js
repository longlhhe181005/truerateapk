// Deterministic licence check (code, not AI). Ported from license/LicenseRegistry.java.
// LICENSED only on an exact normalised match. A near match is UNDETERMINED so a copycat name is never shown as licensed.
import registry from '../data/licensed-lenders.json';

export const LICENSED = 'LICENSED';
export const NOT_FOUND = 'NOT_FOUND';
export const UNDETERMINED = 'UNDETERMINED';

export function normalize(s) {
  if (!s) return '';
  let t = s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
  t = t.replace(/[^a-z0-9]+/g, ' ').trim();
  t = t.replace(
    /\b(cong ty tai chinh|cong ty|cty|tnhh|mtv|co phan|cp|ngan hang|tmcp|thuong mai)\b/g,
    ' '
  );
  return t.replace(/\s+/g, ' ').trim();
}

export function levenshtein(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  let cur = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[b.length];
}

export function isNear(q, alias) {
  if (alias.length >= 5 && (q.includes(alias) || (q.length >= 5 && alias.includes(q)))) {
    return true;
  }
  const max = Math.max(q.length, alias.length);
  return max > 0 && 1 - levenshtein(q, alias) / max >= 0.8;
}

const entries = registry.lenders.map((l) => ({
  name: l.name,
  aliases: [normalize(l.name), ...(l.aliases || []).map(normalize)],
}));

export const lenders = registry.lenders;
export const listVersion = registry.version;
export const listSource = registry.source;

export function checkLicence(lenderName) {
  const base = { listVersion, listSource };
  const q = normalize(lenderName);
  if (!q) return { status: UNDETERMINED, matchedName: '', ...base };

  const exact = entries.find((e) => e.aliases.includes(q));
  if (exact) return { status: LICENSED, matchedName: exact.name, ...base };

  const near = entries.find((e) => e.aliases.some((a) => isNear(q, a)));
  if (near) return { status: UNDETERMINED, matchedName: near.name, ...base };

  return { status: NOT_FOUND, matchedName: '', ...base };
}
