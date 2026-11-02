// Optional link to the TrueRate Spring Boot backend (truerateapk-backend). The AI key lives only on that server.
// Without EXPO_PUBLIC_API_URL, or when the server is unreachable, the app keeps its fixed explanation text.
import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

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

/** Free hosting sleeps when idle: a request at launch wakes it before the first check. Sends no loan data. */
export function wakeServer() {
  if (hasBackend) fetch(`${API_URL}/api/health`).catch(() => {});
}

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

/**
 * Camera photos can pass the server's 5 MB limit and may be HEIC. This size keeps small print readable
 * and always gives a JPEG well under the limit.
 */
const MAX_PHOTO_SIDE = 2000;

async function toUploadableJpeg(asset) {
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width || 0, asset.height || 0) > MAX_PHOTO_SIDE) {
    context.resize(asset.width >= asset.height ? { width: MAX_PHOTO_SIDE } : { height: MAX_PHOTO_SIDE });
  }
  const image = await context.renderAsync();
  const { uri } = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return uri;
}

/** Reads the loan fields from contract photos. assets: ImagePicker assets. */
export async function readContract(assets) {
  if (!hasBackend) {
    throw new Error('Đọc ảnh cần kết nối máy chủ TrueRate. Bạn vẫn có thể nhập tay.');
  }
  const form = new FormData();
  for (const [i, a] of assets.entries()) {
    const uri = await toUploadableJpeg(a);
    const name = `contract-${i + 1}.jpg`;
    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      form.append('file', blob, name);
    } else {
      // Expo's fetch rejects React Native's { uri, name, type } form parts, but accepts a File
      form.append('file', new File(uri));
    }
  }
  form.append('consent', 'true');

  const res = await withTimeout(
    fetch(`${API_URL}/api/ocr`, { method: 'POST', body: form }),
    45000
  ).catch((e) => {
    // fetch reports a network failure as a TypeError with English text
    throw e instanceof TypeError ? new Error('Không kết nối được máy chủ. Bạn có thể nhập tay.') : e;
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(firstError(body, `Không đọc được ảnh (${res.status})`));
  return body;
}
