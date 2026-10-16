import express from 'express';
import http from 'http';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Health check route
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'IponTa API' });
});

// Supabase configuration route (configured in backend environment)
app.get('/api/supabase/config', (_req, res) => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  res.json({ url, anonKey });
});

// Setup Vite or static serving
async function setupServer() {
  const supaUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supaAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        if (supaUrl || supaAnonKey) {
          template = template.replace(
            '</head>',
            `  <script>
      window.__SUPABASE_CONFIG__ = {
        url: ${JSON.stringify(supaUrl)},
        anonKey: ${JSON.stringify(supaAnonKey)}
      };
    </script>
  </head>`
          );
        }
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, () => {
    console.log(`IponTa server running on http://localhost:${PORT}`);
  });
}

setupServer();
