// Pure maths, ported from core/AprCalculator.java. No AI.
// The rate shown to the user covers the loan's own term: (R - P) / P. It is never annualised.
// The legal reference levels are yearly (20% and 100%), so they are converted to the same term before comparing.

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
