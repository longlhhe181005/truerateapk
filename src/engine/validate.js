// US-02: block inconsistent numbers and say which field to fix. Ported from core/InputValidator.java.

export const MAX_LENDER_NAME = 100;
export const MAX_AMOUNT = 100_000_000_000;
export const MAX_DAYS = 9200;
export const MAX_MONTHS = 300;

/**
 * input: { principalVnd, totalRepayVnd, repaymentType, termDays, installments, lenderName,
 *          statedRatePercent, contractAmountVnd }
 * Returns { field: message } (empty object when valid).
 */
export function validate(input) {
  const errors = {};
  const p = input.principalVnd;
  const r = input.totalRepayVnd;
  const monthly = input.repaymentType === 'MONTHLY';
  const name = (input.lenderName || '').trim();

  if (!p || p <= 0) errors.principalVnd = 'Nhập số tiền bạn thực nhận (lớn hơn 0).';
  else if (p > MAX_AMOUNT) errors.principalVnd = 'Số tiền thực nhận quá lớn, hãy kiểm tra lại.';

  if (!r || r <= 0) errors.totalRepayVnd = 'Nhập tổng số tiền bạn phải trả (lớn hơn 0).';
  else if (r > MAX_AMOUNT) errors.totalRepayVnd = 'Tổng tiền phải trả quá lớn, hãy kiểm tra lại.';

  if (p > 0 && r > 0 && r <= p) {
    errors.totalRepayVnd =
      'Tổng tiền phải trả phải lớn hơn số tiền bạn thực nhận. Hãy kiểm tra xem bạn có nhập nhầm hai ô không.';
  }

  if (monthly) {
    const n = input.installments;
    if (!n || n < 2 || n > MAX_MONTHS) {
      errors.installments = `Nhập số kỳ trả góp (từ 2 đến ${MAX_MONTHS} tháng).`;
    }
  } else {
    const d = input.termDays;
    if (!d || d < 1) errors.termDays = 'Nhập số ngày vay (ít nhất 1 ngày).';
    else if (d > MAX_DAYS) errors.termDays = `Số ngày vay tối đa là ${MAX_DAYS} ngày.`;
  }

  if (!name) errors.lenderName = 'Nhập tên bên cho vay như ghi trên hợp đồng hoặc ứng dụng.';
  else if (name.length > MAX_LENDER_NAME) {
    errors.lenderName = `Tên bên cho vay tối đa ${MAX_LENDER_NAME} ký tự.`;
  }

  const stated = input.statedRatePercent;
  if (stated != null && (stated <= 0 || stated > 1000)) {
    errors.statedRatePercent = 'Lãi suất hợp đồng ghi không hợp lệ. Hãy để trống nếu không biết.';
  }
  const contract = input.contractAmountVnd;
  if (contract != null && (contract <= 0 || contract > MAX_AMOUNT)) {
    errors.contractAmountVnd = 'Số tiền ghi trong hợp đồng không hợp lệ. Hãy để trống nếu không muốn nhập.';
  }
  return errors;
}
