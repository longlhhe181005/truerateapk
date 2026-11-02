// The labelling matrix (business rule BR-02). Decided by code, never by AI. Ported from risk/RiskClassifier.java.
// The interest paid is compared with the reference levels converted to the loan's own term (cap20, cap100).
// A high rate alone is never called illegal. "Serious" needs BOTH: no licence found AND interest above cap100.
import { LICENSED, UNDETERMINED } from './licence';

export const CIVIL_REFERENCE_PERCENT = 20;
export const CRIMINAL_REFERENCE_PERCENT = 100;

export const SIGNALS = {
  FEE_BEFORE: 'Bị yêu cầu trả phí trước khi nhận tiền (phí hồ sơ, phí xác minh, bảo hiểm...)',
  CONTACTS: 'Ứng dụng xin quyền truy cập danh bạ, ảnh hoặc vị trí',
  NAME_MISMATCH:
    'Tên pháp lý trong hợp đồng khác tên ứng dụng, hoặc không tra được mã số doanh nghiệp',
  HARASSMENT: 'Đã bị nhắn tin hoặc gọi điện đe dọa, làm phiền người thân',
};

const label = (code, level, title, message) => ({ code, level, title, message });

function classifyBase(licence, extra, cap20, cap100) {
  if (licence === UNDETERMINED) {
    return label(
      'UNDETERMINED',
      'unknown',
      'Chưa xác định được bên cho vay',
      'Tên bạn nhập chưa khớp chắc chắn với danh sách cấp phép (có thể gần giống một đơn vị khác hoặc gõ sai). ' +
        'Hãy nhập lại đúng tên pháp lý như ghi trên hợp đồng, hoặc hỏi bên cho vay mã số doanh nghiệp.'
    );
  }
  if (licence === LICENSED) {
    if (extra <= cap20) {
      return label(
        'LICENSED_LOW',
        'low',
        'Có trong danh sách cấp phép · lãi thấp',
        'Đơn vị có trong danh sách cấp phép và tiền lãi nằm trong mức tham khảo 20%/năm tính cho số ngày vay.'
      );
    }
    if (extra <= cap100) {
      return label(
        'LICENSED_HIGH',
        'caution',
        'Có trong danh sách cấp phép · lãi cao hơn mức tham khảo',
        'Đơn vị có trong danh sách cấp phép nhưng tiền lãi cao hơn mức tham khảo 20%/năm tính cho số ngày vay. ' +
          'Hãy so sánh với các lựa chọn khác trước khi vay.'
      );
    }
    return label(
      'LICENSED_VERY_HIGH',
      'high',
      'Có trong danh sách cấp phép · lãi rất cao',
      'Tiền lãi rất cao so với mốc tham khảo tính cho số ngày vay. Hãy đối chiếu các con số với hợp đồng gốc (có thể nhập nhầm), và hỏi bên cho vay bằng văn bản về từng khoản phí.'
    );
  }
  if (extra > cap100) {
    return label(
      'SERIOUS',
      'serious',
      'Cảnh báo nghiêm trọng',
      'Không tìm thấy bên cho vay trong danh sách cấp phép và tiền lãi vượt mức tham khảo 100%/năm tính cho số ngày vay. ' +
        'Đây là dấu hiệu rủi ro nghiêm trọng, nhưng chỉ cơ quan có thẩm quyền mới kết luận được. ' +
        'Một số doanh nghiệp hợp pháp (ví dụ cầm đồ) hoạt động ngoài danh sách tổ chức tín dụng, nên hãy kiểm tra giấy đăng ký kinh doanh. ' +
        'Hãy cân nhắc kỹ trước khi vay hoặc trả thêm.'
    );
  }
  return label(
    'NOT_FOUND',
    'caution',
    'Chưa thấy trong danh sách cấp phép',
    'Không tìm thấy bên cho vay trong danh sách cấp phép hiện có. Hãy kiểm tra lại tên hoặc hỏi bên cho vay ' +
      'về giấy phép và mã số doanh nghiệp. Chưa tìm thấy không có nghĩa là chắc chắn vi phạm, ' +
      'và lãi suất thấp cũng không có nghĩa là an toàn.'
  );
}

/**
 * Warning signs the user ticked matter even when the rate is low:
 * a low rate does not make an unverified lender safe.
 */
export function classify(licence, extra, cap20, cap100, signalCount = 0) {
  const base = classifyBase(licence, extra, cap20, cap100);
  if (signalCount > 0 && licence !== LICENSED && base.code !== 'SERIOUS') {
    return label(
      'RISK_SIGNALS',
      'high',
      `Có dấu hiệu rủi ro, dù lãi suất ${extra <= cap100 ? 'chưa quá cao' : 'cao'}`,
      `Bạn đã đánh dấu ${signalCount} dấu hiệu đáng ngờ và chưa xác minh được bên cho vay trong danh sách cấp phép. ` +
        'Lãi suất thấp không có nghĩa là an toàn: một số bên thu phí trước, đòi quyền truy cập danh bạ hoặc mạo danh tên khác. ' +
        'Hãy dừng lại, kiểm tra tên pháp lý và mã số doanh nghiệp, và đừng gửi thêm giấy tờ hay tiền trước khi xác minh.'
    );
  }
  return base;
}
