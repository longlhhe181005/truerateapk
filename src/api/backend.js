// Optional link to the TrueRate Spring Boot backend (EXE101/TrueRate). The AI key lives only on that server.
// Without EXPO_PUBLIC_API_URL, or when the server is unreachable, the app keeps its fixed explanation text.
import { Platform } from 'react-native';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');
export const hasBackend = Boolean(API_URL);

async function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Máy chủ phản hồi quá lâu.')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

const firstError = (body, fallback) => body?.errors?.[0]?.message || fallback;

/** { status, aiMode, ocr } or throws. */
export async function health() {
  if (!hasBackend) throw new Error('Chưa cấu hình máy chủ.');
  const res = await withTimeout(fetch(`${API_URL}/api/health`), 5000);
  if (!res.ok) throw new Error(`Máy chủ lỗi (${res.status})`);
  return res.json();
}

/**
 * Asks the backend to word the result. Returns only the AI part:
 * { explanation, legalComparison, nextStep, nextStepText, ai }.
 */
export async function explain(input) {
  if (!hasBackend) throw new Error('Chưa cấu hình máy chủ.');
  const res = await withTimeout(
    fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, consent: true }),
    }),
    25000
  );
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(firstError(body, `Máy chủ lỗi (${res.status})`));
  const { explanation, legalComparison, nextStep, nextStepText, ai } = body;
  return { explanation, legalComparison, nextStep, nextStepText, ai };
}

/** Reads the loan fields from contract photos. assets: ImagePicker assets. */
export async function readContract(assets) {
  if (!hasBackend) {
    throw new Error('Đọc ảnh cần kết nối máy chủ TrueRate. Bạn vẫn có thể nhập tay.');
  }
  const form = new FormData();
  for (const [i, a] of assets.entries()) {
    const name = a.fileName || `contract-${i + 1}.jpg`;
    const type = a.mimeType || 'image/jpeg';
    if (Platform.OS === 'web') {
      const blob = await (await fetch(a.uri)).blob();
      form.append('file', blob, name);
    } else {
      form.append('file', { uri: a.uri, name, type });
    }
  }
  form.append('consent', 'true');

  const res = await withTimeout(
    fetch(`${API_URL}/api/ocr`, { method: 'POST', body: form }),
    45000
  );
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(firstError(body, `Không đọc được ảnh (${res.status})`));
  return body;
}
