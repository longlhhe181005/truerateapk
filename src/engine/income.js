// What one payment takes from a month's income. Runs on the device only: income is never sent or stored.

export const MAX_INCOME = 10_000_000_000;
export const CAUTION_PERCENT = 30;
export const DANGER_PERCENT = 40;

/** One-time loans compare the whole repayment with one month's income, because it is paid at once. */
export function incomeBurden(result, income) {
  const monthly = result.repaymentType === 'MONTHLY';
  const payment = monthly ? result.installmentVnd : result.totalRepayVnd;
  const percent = Math.round((payment / income) * 1000) / 10;
  return {
    incomeVnd: income,
    paymentVnd: payment,
    remainingVnd: income - payment,
    percent,
    monthly,
    level: percent > DANGER_PERCENT ? 'danger' : percent > CAUTION_PERCENT ? 'caution' : 'ok',
  };
}
