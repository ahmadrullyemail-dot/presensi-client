import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_API_BASE_URL || 'http://localhost:3100';
  const appId = env.BACKEND_APP_ID || 'ernmysql-frontend';
  const secret = env.VITE_HMAC_SECRET || env.BACKEND_HMAC_SECRET || 'ernmysql_hmac_secret_dev_2024_change_in_prod';

  return {
    plugins: [
      react(),
      {
        name: 'hmac-backend-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            // Hanya intercept request yang diawali /api
            if (!req.url.startsWith('/api')) {
              return next();
            }

            try {
              // 1. Baca raw body sebagai string
              const chunks = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              const rawBody = Buffer.concat(chunks).toString('utf8');

              // 2. Format perhitungan HMAC:
              //    message = METHOD + "\n" + PATH_NO_QUERY + "\n" + TIMESTAMP_MS + "\n" + RAW_BODY
              const method = req.method.toUpperCase();
              const pathNoQuery = req.url.split('?')[0];
              const timestamp = req.headers['x-timestamp'] || Date.now().toString();

              let signature = req.headers['x-signature'];
              if (!signature && secret) {
                const message = `${method}\n${pathNoQuery}\n${timestamp}\n${rawBody}`;
                signature = crypto.createHmac('sha256', secret).update(message).digest('hex');
              }

              const targetUrl = `${backendTarget}${req.url}`;

              const headers = {
                'X-App-ID': req.headers['x-app-id'] || appId,
                'X-Timestamp': timestamp,
                'X-Signature': signature || '',
              };
              if (req.headers['content-type']) {
                headers['Content-Type'] = req.headers['content-type'];
              }

              // 3. Teruskan request ke backend localhost:3100
              const backendRes = await fetch(targetUrl, {
                method,
                headers,
                body: ['GET', 'HEAD'].includes(method) ? undefined : rawBody,
              });

              res.statusCode = backendRes.status;
              const contentType = backendRes.headers.get('content-type');
              if (contentType) {
                res.setHeader('Content-Type', contentType);
              }

              const data = await backendRes.text();
              res.end(data);
            } catch (err) {
              console.error('[Vite HMAC Proxy Error]:', err);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: 'Proxy lokal gagal terhubung ke backend localhost:3100: ' + err.message,
                })
              );
            }
          });
        },
      },
    ],
  };
});
