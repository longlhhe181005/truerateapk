// Pure maths, ported from core/AprCalculator.java. No AI.
// Simple annual rate = (R - P) / P * 365 / d: same basis as the legal reference levels (20% and 100% per year).
// Compound rate = (1 + (R - P) / P)^(365 / d) - 1: assumes the loan is rolled over; shown as extra information.

export const CAP_PERCENT = 1_000_000;

const capped = (v) => (!Number.isFinite(v) || v > CAP_PERCENT ? CAP_PERCENT : v);

export function simplePercent(principal, totalRepay, days) {
  return capped(((totalRepay - principal) / principal) * (365 / days) * 100);
}

export function compoundPercent(principal, totalRepay, days) {
  const ratio = (totalRepay - principal) / principal;
  return capped((Math.pow(1 + ratio, 365 / days) - 1) * 100);
}

/**
 * Equal monthly instalments: the borrower receives `principal` today and pays `payment` at the end of each month.
 * Returns the monthly rate i that makes the payments worth exactly the amount received (IRR, by bisection).
 */
export function monthlyRate(principal, payment, months) {
  let lo = 0;
  let hi = 10;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const pv = mid === 0 ? payment * months : (payment * (1 - Math.pow(1 + mid, -months))) / mid;
    if (pv > principal) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Simple annual rate for instalments: monthly rate x 12, the same basis as the legal reference levels. */
export function instalmentSimplePercent(principal, totalRepay, months) {
  const i = monthlyRate(principal, totalRepay / months, months);
  return Math.min(i * 12 * 100, CAP_PERCENT);
}

/** Effective annual rate if monthly interest compounded: (1 + i)^12 - 1. */
export function instalmentCompoundPercent(principal, totalRepay, months) {
  const i = monthlyRate(principal, totalRepay / months, months);
  return capped((Math.pow(1 + i, 12) - 1) * 100);
}

/** Interest allowed for a single payment after `days` at a yearly reference rate (simple interest). */
export function referenceCostOneTime(principal, days, yearlyPercent) {
  return Math.round(((principal * yearlyPercent) / 100) * (days / 365));
}

/** Total interest of equal monthly instalments at a yearly reference rate (declining balance). */
export function referenceCostInstalments(principal, months, yearlyPercent) {
  const i = yearlyPercent / 100 / 12;
  const payment = i === 0 ? principal / months : (principal * i) / (1 - Math.pow(1 + i, -months));
  return Math.round(payment * months - principal);
}

export const isCapped = (percent) => percent >= CAP_PERCENT;

/** Equal-instalment schedule: interest on the remaining balance at the implied monthly rate. */
export function schedule(principal, totalRepay, months) {
  const payment = totalRepay / months;
  const i = monthlyRate(principal, payment, months);
  const rows = [];
  let balance = principal;
  for (let k = 1; k <= months; k++) {
    const interest = balance * i;
    const principalPart = payment - interest;
    balance = Math.max(0, balance - principalPart);
    rows.push({
      k,
      payment: Math.round(payment),
      interest: Math.round(interest),
      principal: Math.round(principalPart),
      balance: Math.round(balance),
    });
  }
  return rows;
}
