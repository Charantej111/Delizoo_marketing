import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handleSendEmail } from './server/emailHandler.js';

function emailApiPlugin() {
  return {
    name: 'delizoo-email-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/send-email', async (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            const result = await handleSendEmail(parsed);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = result.success ? 200 : 200; // Return 200 so frontend receives structured status
            res.end(JSON.stringify(result));
          } catch (err) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  return {
    plugins: [
      react(),
      tailwindcss(),
      emailApiPlugin()
    ],
    server: {
      port: 3000,
      host: true,
      open: true
    }
  };
});
