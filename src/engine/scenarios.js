// Ported from core/ScenarioCalculator.java. Pure maths, no AI.
// For each way a lender may have applied the stated rate, find the principal that would give exactly the total to repay.
// That implied principal is compared with the amount received plus listed fees; a gap nothing explains is the hidden cost.

export const tolerance = (principal) => Math.max(2000, Math.round(principal * 0.003));

function make(code, title, how, basis, principal, listedFees) {
  const b = Math.round(basis);
  const gap = b - principal;
  const unexplained = gap - listedFees;
  const tol = tolerance(principal);
  let status;
  if (Math.abs(unexplained) <= tol) status = listedFees > tol ? 'FEES_EXPLAIN' : 'MATCH';
  else if (unexplained > 0) status = 'HIDDEN';
  else status = 'LOWER';
  return { code, title, how, impliedBasisVnd: b, gapVnd: gap, unexplainedVnd: unexplained, status };
}

/** One payment at the end. ratePercent = stated percent per year. */
export function oneTime(principal, totalRepay, days, ratePercent, listedFees) {
  const r = ratePercent / 100;
  return [
    make(
      'SIMPLE',
      'Lãi đơn trên dư nợ',
      'Lãi = số tiền x lãi suất x số ngày / 365, không cộng dồn',
      totalRepay / (1 + (r * days) / 365),
      principal,
      listedFees
    ),
    make(
      'COMPOUND',
      'Lãi chồng lãi',
      'Lãi chưa trả được cộng vào gốc để tính lãi tiếp',
      totalRepay / Math.pow(1 + r, days / 365),
      principal,
      listedFees
    ),
  ];
}

/** Equal monthly instalments. */
export function monthly(principal, totalRepay, months, ratePercent, listedFees) {
  const payment = totalRepay / months;
  const i = ratePercent / 100 / 12;
  const annuity = i === 0 ? payment * months : (payment * (1 - Math.pow(1 + i, -months))) / i;
  return [
    make(
      'DECLINING',
      'Lãi trên dư nợ giảm dần',
      'Mỗi kỳ trả bằng nhau; lãi tính trên nợ gốc còn lại',
      annuity,
      principal,
      listedFees
    ),
    make(
      'FLAT',
      'Lãi cố định trên gốc ban đầu',
      'Lãi tính trên toàn bộ gốc ban đầu cho cả kỳ vay, chia đều các kỳ',
      totalRepay / (1 + ((ratePercent / 100) * months) / 12),
      principal,
      listedFees
    ),
  ];
}

/** The scenario whose unexplained gap is smallest. */
export const best = (list) =>
  list.reduce((a, s) => (Math.abs(s.unexplainedVnd) < Math.abs(a.unexplainedVnd) ? s : a));
