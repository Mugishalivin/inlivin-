import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import serveStatic from 'serve-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Serve static files from /dist directory (Vite production build)
app.use(serveStatic(path.resolve(__dirname, 'dist'), {
  index: false
}));

// SPA fallback: serve index.html for all client-side routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist/index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    server: 'Inlivin PM2', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const server = createServer(app);

// Start server (matches vite dev port)
server.listen(PORT, '::', () => {
  console.log(`🚀 Inlivin production server ready!`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/health`);
  console.log(`📦 Serving from: ${path.resolve(__dirname, 'dist')}`);
});

// Graceful shutdown for PM2
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('🛑 Graceful shutdown...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
}
