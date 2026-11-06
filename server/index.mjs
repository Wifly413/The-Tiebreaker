/**
 * Arranque del servidor. En Render: `npm start` (PORT lo inyecta la plataforma).
 * En local: `npm run dev` levanta Vite en 3000 y este proceso en 3001.
 */
import { createApp } from './app.mjs';
import { readConfig, describeConfig } from './config.mjs';

const config = readConfig();
const app = createApp(config);

const server = app.listen(config.port, '0.0.0.0', () => {
  const summary = describeConfig(config);
  console.log(`[tiebreaker] escuchando en http://0.0.0.0:${config.port}`);
  console.log(`[tiebreaker] proveedor=${summary.provider} modelo=${summary.model} clave=${summary.key}`);
  console.log(`[tiebreaker] límites: ${summary.rateLimit} · diario ${summary.dailyLimit}`);
  if (!config.apiKey) {
    console.warn('[tiebreaker] sin OPENCODE_API_KEY: la app funciona en modo ejemplo.');
  }
});

function shutdown(signal) {
  console.log(`[tiebreaker] ${signal}: cerrando…`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 8000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('[tiebreaker] promesa rechazada', reason instanceof Error ? reason.message : reason);
});
