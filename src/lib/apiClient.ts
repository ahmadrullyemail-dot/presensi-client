const env = (import.meta as ImportMeta & {
  env?: Record<string, string | undefined>;
}).env;

const HMAC_SECRET = env?.VITE_HMAC_SECRET;
const APP_ID = env?.BACKEND_VITE_APP_ID;

/**
 * hmacSign — Menghitung HMAC-SHA256 signature sesuai standar backend
 * Formula: METHOD + "\n" + PATH_NO_QUERY + "\n" + TIMESTAMP_MS + "\n" + RAW_BODY
 */
export async function hmacSign(
  method: string,
  path: string,
  timestamp: string,
  body: string
): Promise<string> {
  const message = `${method}\n${path}\n${timestamp}\n${body}`;
  const keyData = new TextEncoder().encode(HMAC_SECRET);
  const msgData = new TextEncoder().encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * request — Wrapper HTTP request yang otomatis menyematkan header keamanan HMAC
 * (X-App-ID, X-Timestamp, X-Signature) untuk semua request non-login.
 */
export async function request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const isLogin = path === '/api/auth/login';
  const timestamp = String(Date.now());
  const signedPath = path.split('?')[0];
  const bodyStr = body === undefined ? '' : JSON.stringify(body);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!isLogin) {
    const signature = await hmacSign(method, signedPath, timestamp, bodyStr);
    headers['X-App-ID'] = APP_ID;
    headers['X-Timestamp'] = timestamp;
    headers['X-Signature'] = signature;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: method === 'GET' ? undefined : (bodyStr || undefined),
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    const errorMsg =
      (typeof data === 'object' && data !== null && (data.message || data.error || data.alert)) ||
      (typeof data === 'string' && data) ||
      `HTTP ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}
