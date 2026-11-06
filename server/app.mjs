/**
 * Aplicación HTTP: sirve el front compilado y expone la API que habla con el
 * proveedor. La clave vive solo aquí, en el servidor.
 */
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readConfig, isProviderConfigured } from './config.mjs';
import { createLimiter } from './rateLimit.mjs';
import { createCompletion, UpstreamError } from './provider.mjs';
import {
  ANALYSIS_TYPES,
  MAX_DECISION,
  MAX_LENS,
  buildMessages,
  assertPayload,
  unwrapJson,
} from './analysis.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(fs.readFileSync(path.join(here, '..', 'package.json'), 'utf8'));

export const APP_VERSION = packageJson.version || '0.0.0';

function readVersion() {
  return APP_VERSION;
}

export function createApp(config = readConfig()) {
  const app = express();
  const limiter = createLimiter({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    dailyLimit: config.dailyLimit,
  });

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.use(express.json({ limit: '32kb' }));

  /* ------------------------------------------------------------------ health */

  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      ready: isProviderConfigured(config),
      provider: 'opencode',
      model: config.model,
      version: readVersion(),
      limits: { windowMinutes: Math.round(config.rateLimit.windowMs / 60000), perWindow: config.rateLimit.max },
    });
  });

  /* ----------------------------------------------------------------- analyze */

  app.post('/api/analyze', async (req, res) => {
    const started = Date.now();
    const body = req.body ?? {};

    const analysisType = body.analysisType;
    const decision = typeof body.decision === 'string' ? body.decision.trim() : '';
    const lens = typeof body.lens === 'string' ? body.lens.trim() : '';

    if (!ANALYSIS_TYPES.includes(analysisType)) {
      return res.status(400).json({ error: 'Método de análisis desconocido.', code: 'BAD_METHOD' });
    }
    if (!decision) {
      return res.status(400).json({ error: 'Escribe tu dilema antes de pedir la lectura.', code: 'EMPTY_DECISION' });
    }
    if (decision.length > MAX_DECISION) {
      return res
        .status(400)
        .json({ error: `El dilema no puede pasar de ${MAX_DECISION} caracteres.`, code: 'DECISION_TOO_LONG' });
    }
    if (lens.length > MAX_LENS) {
      return res
        .status(400)
        .json({ error: `La lente no puede pasar de ${MAX_LENS} caracteres.`, code: 'LENS_TOO_LONG' });
    }
    if (!isProviderConfigured(config)) {
      return res.status(503).json({
        error: 'El servidor no tiene configurada la clave del proveedor (OPENCODE_API_KEY). Mientras tanto, puedes ver el caso de ejemplo.',
        code: 'NO_KEY',
      });
    }

    const limit = limiter.take(req.ip || 'unknown');
    if (!limit.ok) {
      res.setHeader('Retry-After', String(limit.retryAfter));
      return res.status(limit.status).json({ error: limit.message, code: limit.status === 429 ? 'RATE_LIMIT' : 'DAILY_LIMIT' });
    }

    const controller = new AbortController();
    let clientGone = false;
    // `req` emite 'close' al terminar de leer el cuerpo, no al desconectarse el
    // cliente: hay que escuchar a la respuesta.
    res.on('close', () => {
      if (!res.writableEnded) {
        clientGone = true;
        controller.abort();
      }
    });

    try {
      const messages = buildMessages(analysisType, decision, lens);
      const { text, usage, model } = await createCompletion(messages, config, controller.signal);

      let parsed;
      try {
        parsed = JSON.parse(unwrapJson(text));
      } catch {
        throw new UpstreamError('La IA devolvió una respuesta que no es JSON válido. Vuelve a intentarlo.', {
          code: 'BAD_JSON',
          status: 502,
        });
      }

      try {
        assertPayload(parsed, analysisType);
      } catch (error) {
        throw new UpstreamError('La IA devolvió una lectura incompleta. Vuelve a intentarlo.', {
          code: 'INCOMPLETE',
          status: 502,
          cause: error,
        });
      }

      const ms = Date.now() - started;
      const cost = usage && typeof usage.cost === 'number' ? usage.cost : null;
      console.log(
        `[analyze] ok method=${analysisType} ms=${ms} model=${model}${cost !== null ? ` cost=$${cost}` : ''}`,
      );
      return res.json({ result: parsed, meta: { model, ms, cost } });
    } catch (error) {
      if (clientGone || controller.signal.aborted) return;

      if (error instanceof UpstreamError) {
        if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter));
        console.warn(`[analyze] error method=${analysisType} code=${error.code} status=${error.status}`);
        return res.status(error.status).json({ error: error.message, code: error.code });
      }

      console.error('[analyze] error inesperado', error instanceof Error ? error.message : error);
      return res.status(500).json({ error: 'No se pudo completar el análisis. Vuelve a intentarlo.', code: 'INTERNAL' });
    }
  });

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Ruta de API no encontrada.', code: 'NOT_FOUND' });
  });

  /* ------------------------------------------------------------------ static */

  const distDir = path.isAbsolute(config.distDir) ? config.distDir : path.join(here, '..', config.distDir);
  const indexFile = path.join(distDir, 'index.html');
  const hasBuild = fs.existsSync(indexFile);

  if (hasBuild) {
    app.use(
      '/assets',
      express.static(path.join(distDir, 'assets'), {
        immutable: true,
        maxAge: '1y',
        fallthrough: true,
      }),
    );
    app.use(express.static(distDir, { index: false, maxAge: '10m' }));
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (!req.accepts('html')) return next();
      res.sendFile(indexFile);
    });
  } else {
    app.get('/', (req, res) => {
      res.status(503).type('text/plain').send('Front no compilado. Ejecuta "npm run build" o "npm run dev".');
    });
  }

  /* ------------------------------------------------------------------ errores */

  app.use((req, res) => {
    res.status(404).json({ error: 'Recurso no encontrado.', code: 'NOT_FOUND' });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido.', code: 'BAD_BODY' });
    }
    if (error?.type === 'entity.too.large') {
      return res.status(413).json({ error: 'La petición es demasiado grande.', code: 'TOO_LARGE' });
    }
    console.error('[server] error', error instanceof Error ? error.message : error);
    return res.status(500).json({ error: 'Error interno del servidor.', code: 'INTERNAL' });
  });

  app.locals.limiter = limiter;
  return app;
}
