import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false, // Jangan parse body otomatis agar RAW_BODY utuh untuk perhitungan HMAC
  },
};

/**
 * Vercel Serverless Function Proxy
 * Menghubungkan Frontend Vercel ke Backend 35.224.177.116:3100
 * serta menyematkan header keamanan X-App-ID, X-Timestamp, dan X-Signature (HMAC-SHA256).
 */
export default async function handler(req, res) {
  try {
    // 1. Baca raw body sebagai string
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks).toString('utf8');

    // 2. Ambil konfigurasi backend dari Environment Variables Vercel atau default fallback
    const backendTarget = process.env.VITE_API_BASE_URL || 'http://35.224.177.116:3100';
    const appId = req.headers['x-app-id'] || process.env.BACKEND_APP_ID || 'ernmysql-frontend';
    const secret = process.env.VITE_HMAC_SECRET || process.env.BACKEND_HMAC_SECRET || 'ernmysql_hmac_secret_dev_2024_change_in_prod';

    // 3. Hitung atau teruskan HMAC-SHA256
    //    message = METHOD + "\n" + PATH_NO_QUERY + "\n" + TIMESTAMP_MS + "\n" + RAW_BODY
    const method = req.method.toUpperCase();
    const urlObj = new URL(req.url, 'http://localhost');
    const pathNoQuery = urlObj.pathname;
    const timestamp = req.headers['x-timestamp'] || Date.now().toString();

    let signature = req.headers['x-signature'];
    if (!signature && secret) {
      const message = `${method}\n${pathNoQuery}\n${timestamp}\n${rawBody}`;
      signature = crypto.createHmac('sha256', secret).update(message).digest('hex');
    }

    const targetUrl = `${backendTarget}${req.url}`;

    // 4. Siapkan headers — SELALU kirim ketiga header keamanan (X-App-ID, X-Timestamp, X-Signature)
    const headers = {
      'X-App-ID': appId,
      'X-Timestamp': timestamp,
      'X-Signature': signature || '',
    };
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }

    // Log debug — tampil di Vercel → Functions → Logs
    console.log(`[Proxy] ${method} ${targetUrl}`);
    console.log(`[Proxy] App-ID: ${appId} | Timestamp: ${timestamp} | signature: ${signature ? signature.slice(0, 12) + '...' : '(kosong)'}`);

    // 5. Teruskan request ke backend GCP
    const backendRes = await fetch(targetUrl, {
      method,
      headers,
      body: ['GET', 'HEAD'].includes(method) ? undefined : rawBody,
    });

    res.status(backendRes.status);
    const contentType = backendRes.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);

    const data = await backendRes.text();
    console.log(`[Proxy] Backend responded: ${backendRes.status} — ${data.slice(0, 120)}`);
    return res.send(data);

  } catch (err) {
    console.error('[Vercel HMAC Proxy Error]:', err.message);
    return res.status(502).json({
      error: 'Proxy gagal menghubungi backend 35.224.177.116:3100: ' + err.message,
    });
  }
}
