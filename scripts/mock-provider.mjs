/**
 * Proveedor falso compatible con OpenAI Chat Completions, para probar el
 * servidor sin gastar saldo ni tener clave.
 *
 * Uso:
 *   node scripts/mock-provider.mjs            # escucha en :4010
 *   PORT=4020 node scripts/mock-provider.mjs
 *
 * Control desde el test:
 *   POST /__mode { "mode": "ok" | "401" | "403" | "429" | "500" | "garbage" | "incomplete" | "400-on-json" }
 *   GET  /__count   → { hits }
 */
import http from 'node:http';

const PORT = Number(process.env.PORT || 4010);
let mode = 'ok';
let hits = 0;
/** Últimas cabeceras vistas: los tests comprueban User-Agent y x-opencode-session. */
let lastHeaders = {};

const ENVELOPE = {
  verdict: 'Cierra el local en junio y deja la consultoría en septiembre: el colchón cubre once meses.',
  tilt: 46,
  confidence: 63,
  decisiveFactor: 'El local de 90 m² queda libre en junio y el alquiler del polígono sube en agosto.',
  assumptions: [
    'El local sigue libre en junio y el dueño acepta seis meses con opción a otros seis.',
    'La ayuda de 6.000 € se resuelve en abril.',
  ],
  openQuestion: '¿Cuánto factura tu hermana en los tres mercados al año, con cifras y no con impresiones?',
  nextStep: 'Manda un correo a tu hermana y al dueño del local con tres cifras y el coste del colchón.',
};

const FIXTURES = {
  balance: {
    ...ENVELOPE,
    factors: [
      { text: 'Nueve años gestionando proyectos con presupuestos de 400.000 €.', side: 'for', weight: 3, certainty: 'alta', horizon: 'corto' },
      { text: 'Tienes 24.000 € ahorrados: cubren once meses de gastos fijos.', side: 'for', weight: 3, certainty: 'alta', horizon: 'corto' },
      { text: 'La ayuda de 6.000 € para autónomos se resuelve en abril.', side: 'for', weight: 2, certainty: 'media', horizon: 'corto' },
      { text: 'La hipoteca de 640 € al mes no se puede cubrir con el colchón más de once meses.', side: 'against', weight: 3, certainty: 'alta', horizon: 'medio' },
      { text: 'El alquiler del polígono sube un 8 % en agosto.', side: 'against', weight: 2, certainty: 'alta', horizon: 'corto' },
      { text: 'No hay cartera propia: el 100 % de la facturación del primer año sería nueva.', side: 'against', weight: 3, certainty: 'media', horizon: 'medio' },
    ],
  },
  'head-to-head': {
    ...ENVELOPE,
    options: [
      { name: 'Cerrar y montar el estudio', summary: 'Once meses de colchón y cartera por construir.' },
      { name: 'Esperar a 2028', summary: 'Sueldo estable, proyecto aplazado dos años.' },
    ],
    criteria: [
      { name: 'colchón financiero', weight: 3 },
      { name: 'cartera de clientes', weight: 3 },
      { name: 'coste fijo', weight: 2 },
      { name: 'plazo del local', weight: 2 },
    ],
    scores: [
      [6, 2, 3, 9],
      [9, 9, 9, 1],
    ],
    winner: 0,
    runnerUp: 1,
    tradeoff: 'Cerrar ahora cambia dos años de sueldo estable por un negocio que aún no tiene cartera.',
  },
  strategy: {
    ...ENVELOPE,
    quadrants: {
      strengths: ['Nueve años gestionando proyectos', '24.000 € de colchón'],
      weaknesses: ['Sin cartera propia', 'Hipoteca de 640 € al mes'],
      opportunities: ['Local de 90 m² libre en junio por 480 €', 'Ayuda de 6.000 € en abril'],
      threats: ['El alquiler del polígono sube un 8 %', 'El horno compartido cierra en agosto'],
    },
    moves: [
      { kind: 'atacar', title: 'Firma el local en junio', detail: 'Cruza la experiencia de gestión con el local libre: negocia seis meses con opción a otros seis antes de que lo anuncie el polígono.', priority: 1 },
      { kind: 'defender', title: 'Vende en tres mercados antes de abrir', detail: 'Cruza la cartera inexistente con la subida del 8 %: entra en los tres mercados con series cortas y no compitas por precio.', priority: 2 },
      { kind: 'corregir', title: 'Haz diez piezas de muestra', detail: 'Cruza la falta de cartera con las tres tiendas que han pedido cerámica local: llévales diez piezas antes de septiembre.', priority: 3 },
      { kind: 'mitigar', title: 'Compra un horno de segunda mano', detail: 'Cruza los 14.000 € de inversión con el cierre del horno en agosto: compra uno de segunda mano por 4.500 € antes de junio.', priority: 3 },
    ],
  },
};

function detectType(systemPrompt) {
  if (systemPrompt.includes('BALANZA PONDERADA')) return 'balance';
  if (systemPrompt.includes('CARA A CARA')) return 'head-to-head';
  if (systemPrompt.includes('MAPA ESTRATÉGICO')) return 'strategy';
  return null;
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
  res.end(payload);
}

const server = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
  });
  req.on('end', () => {
    if (req.method === 'POST' && req.url === '/__mode') {
      try {
        mode = JSON.parse(raw || '{}').mode || 'ok';
      } catch {
        mode = 'ok';
      }
      return sendJson(res, 200, { mode });
    }
    if (req.url === '/__count') {
      return sendJson(res, 200, { hits, mode });
    }
    if (req.url === '/__headers') {
      return sendJson(res, 200, lastHeaders);
    }
    if (req.method !== 'POST' || !req.url.startsWith('/chat/completions')) {
      return sendJson(res, 404, { error: { message: 'Ruta no encontrada' } });
    }

    hits += 1;
    lastHeaders = {
      userAgent: req.headers['user-agent'] || null,
      session: req.headers['x-opencode-session'] || null,
    };
    let body = {};
    try {
      body = JSON.parse(raw || '{}');
    } catch {
      return sendJson(res, 400, { error: { message: 'JSON inválido' } });
    }

    if (!req.headers.authorization?.startsWith('Bearer ')) {
      return sendJson(res, 401, { error: { message: 'Missing bearer token' } });
    }

    // OpenCode Go rechaza con 400 si falta la cabecera de sesión: el mock la
    // exige también para que los tests fallen si el servidor deja de enviarla.
    if (mode !== 'no-session' && !req.headers['x-opencode-session']) {
      return sendJson(res, 400, {
        error: { message: 'Request is missing x-opencode-session and cannot be routed efficiently.' },
      });
    }
    if (mode !== 'no-session' && !/the-tiebreaker/i.test(req.headers['user-agent'] || '')) {
      return sendJson(res, 400, {
        error: { message: 'Request must identify itself with a product User-Agent.' },
      });
    }
    if (mode === 'no-session') {
      return sendJson(res, 400, {
        error: { message: 'Request is missing x-opencode-session and cannot be routed efficiently.' },
      });
    }

    if (mode === '400-on-json' && body.response_format) {
      return sendJson(res, 400, { error: { message: 'response_format is not supported by this model' } });
    }

    if (mode === '401') return sendJson(res, 401, { error: { message: 'invalid api key' } });
    if (mode === '402') return sendJson(res, 402, { error: { message: 'Insufficient account funds' } });
    if (mode === '403') return sendJson(res, 403, { error: { message: 'free models are only available from within OpenCode' } });
    if (mode === '429') {
      res.setHeader('Retry-After', '42');
      return sendJson(res, 429, { error: { message: 'rate limit exceeded' } });
    }
    if (mode === '500') return sendJson(res, 500, { error: { message: 'upstream exploded' } });

    const systemPrompt = body.messages?.find((message) => message.role === 'system')?.content || '';
    const type = detectType(systemPrompt);
    if (!type) return sendJson(res, 400, { error: { message: 'método no detectado en el prompt' } });

    let content = JSON.stringify(FIXTURES[type]);
    if (mode === 'garbage') content = 'Lo siento, no puedo ayudar con eso.';
    if (mode === 'incomplete') content = JSON.stringify({ verdict: 'Falta casi todo.' });
    if (mode === 'fenced') content = '```json\n' + content + '\n```';

    const payload = {
      id: 'chatcmpl-mock',
      object: 'chat.completion',
      model: body.model || 'mock-model',
      choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 1200, completion_tokens: 300, cost: 0.00042 },
    };
    return sendJson(res, 200, payload);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[mock-provider] http://127.0.0.1:${PORT}`);
});
