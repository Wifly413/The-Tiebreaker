/**
 * Tests de la API del servidor (sin red externa): levanta un proveedor falso y
 * tres instancias del servidor (normal, con límite bajo y sin clave).
 *
 * Uso: npm run test:api   (antes: npm run build, para probar también el front)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const children = [];
const results = [];

function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

function start(file, env, label) {
  const child = spawn(process.execPath, [file], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.on('data', (chunk) => {
    output += chunk;
  });
  child.on('exit', (code) => {
    if (code && code !== 0) console.error(`[${label}] salió con ${code}: ${output.slice(-400)}`);
  });
  children.push(child);
  return child;
}

async function waitFor(url, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try {
      const response = await fetch(url);
      if (response.status < 500) return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return false;
}

async function call(port, route, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: response.status, json, text, headers: response.headers };
}

const DECISION = 'Quiero dejar la consultoría en septiembre para montar un estudio de cerámica con mi hermana. Tengo 24.000 € ahorrados y una hipoteca de 640 € al mes. ¿Lo hago ahora o espero a 2028?';

async function main() {
  const mockPort = 4010;
  const mainPort = 3111;
  const limitedPort = 3112;
  const noKeyPort = 3113;

  start('scripts/mock-provider.mjs', { PORT: String(mockPort) }, 'mock');
  start(
    'server/index.mjs',
    {
      PORT: String(mainPort),
      OPENCODE_API_KEY: 'test-key',
      OPENCODE_BASE_URL: `http://127.0.0.1:${mockPort}`,
      OPENCODE_MODEL: 'mock-model',
      RATE_LIMIT_MAX: '100',
      DAILY_LIMIT: '1000',
    },
    'server',
  );
  start(
    'server/index.mjs',
    {
      PORT: String(limitedPort),
      OPENCODE_API_KEY: 'test-key',
      OPENCODE_BASE_URL: `http://127.0.0.1:${mockPort}`,
      OPENCODE_MODEL: 'mock-model',
      RATE_LIMIT_MAX: '2',
      DAILY_LIMIT: '1000',
    },
    'server-limited',
  );
  start(
    'server/index.mjs',
    {
      PORT: String(noKeyPort),
      OPENCODE_API_KEY: '',
      OPENCODE_BASE_URL: `http://127.0.0.1:${mockPort}`,
      OPENCODE_MODEL: 'mock-model',
    },
    'server-nokey',
  );

  const ready = await Promise.all([
    waitFor(`http://127.0.0.1:${mockPort}/__count`),
    waitFor(`http://127.0.0.1:${mainPort}/api/health`),
    waitFor(`http://127.0.0.1:${limitedPort}/api/health`),
    waitFor(`http://127.0.0.1:${noKeyPort}/api/health`),
  ]);
  if (ready.includes(false)) throw new Error('No arrancaron todos los procesos');

  const setMode = (mode) => call(mockPort, '/__mode', { method: 'POST', body: { mode } });

  /* ---------------------------------------------------------------- health */

  const health = await call(mainPort, '/api/health');
  check('health responde 200', health.status === 200, String(health.status));
  check('health.ready=true con clave', health.json?.ready === true);
  check('health no expone la clave ni la URL del proveedor', !JSON.stringify(health.json).includes('test-key') && !JSON.stringify(health.json).includes('4010'));
  check('health declara proveedor y modelo', health.json?.provider === 'opencode' && health.json?.model === 'mock-model');

  const noKeyHealth = await call(noKeyPort, '/api/health');
  check('sin clave, health.ready=false', noKeyHealth.json?.ready === false);

  /* --------------------------------------------------------------- análisis */

  await setMode('ok');
  for (const type of ['balance', 'head-to-head', 'strategy']) {
    const response = await call(mainPort, '/api/analyze', {
      method: 'POST',
      body: { decision: DECISION, analysisType: type, lens: '' },
    });
    check(`analyze ${type} devuelve 200`, response.status === 200, String(response.status));
    check(`analyze ${type} trae veredicto y cuerpo`, Boolean(response.json?.result?.verdict));
    check(`analyze ${type} reporta modelo`, response.json?.meta?.model === 'mock-model');
  }

  const lensResponse = await call(mainPort, '/api/analyze', {
    method: 'POST',
    body: { decision: DECISION, analysisType: 'balance', lens: 'Actúa como asesor financiero estricto.' },
  });
  check('analyze acepta lente', lensResponse.status === 200);

  /* ------------------------------------------- cabeceras de OpenCode Go ---- */

  const firstHeaders = await call(mockPort, '/__headers');
  check(
    'el proveedor recibe un User-Agent de producto (no de librería)',
    /the-tiebreaker/i.test(firstHeaders.json?.userAgent || ''),
    String(firstHeaders.json?.userAgent),
  );
  check(
    'el proveedor recibe x-opencode-session',
    /^[A-Za-z0-9-]{8,64}$/.test(firstHeaders.json?.session || ''),
    String(firstHeaders.json?.session),
  );

  const again = await call(mainPort, '/api/analyze', {
    method: 'POST',
    body: { decision: DECISION, analysisType: 'balance' },
  });
  const secondHeaders = await call(mockPort, '/__headers');
  check('dos peticiones seguidas reutilizan la sesión (fallback por IP)', again.status === 200 && secondHeaders.json?.session === firstHeaders.json?.session);

  const clientSession = await call(mainPort, '/api/analyze', {
    method: 'POST',
    headers: { 'X-Tiebreaker-Session': 'browser-session-abc123' },
    body: { decision: DECISION, analysisType: 'balance' },
  });
  const thirdHeaders = await call(mockPort, '/__headers');
  check(
    'la sesión del navegador se reenvía tal cual',
    clientSession.status === 200 && thirdHeaders.json?.session === 'browser-session-abc123',
    String(thirdHeaders.json?.session),
  );

  const uglySession = await call(mainPort, '/api/analyze', {
    method: 'POST',
    headers: { 'X-Tiebreaker-Session': 'weird<script>value!with·chars' },
    body: { decision: DECISION, analysisType: 'balance' },
  });
  const fourthHeaders = await call(mockPort, '/__headers');
  check(
    'la sesión se sanea a [A-Za-z0-9-]',
    uglySession.status === 200 && /^[A-Za-z0-9-]+$/.test(fourthHeaders.json?.session || ''),
    String(fourthHeaders.json?.session),
  );

  await setMode('no-session');
  const sessionError = await call(mainPort, '/api/analyze', {
    method: 'POST',
    body: { decision: DECISION, analysisType: 'balance' },
  });
  check(
    'un 400 por sesión se explica como PROVIDER_SESSION (sin reintento)',
    sessionError.status === 502 && sessionError.json?.code === 'PROVIDER_SESSION',
    `${sessionError.status} ${sessionError.json?.code}`,
  );
  await setMode('ok');

  /* ------------------------------------------------------------- validación */

  const noDecision = await call(mainPort, '/api/analyze', { method: 'POST', body: { analysisType: 'balance' } });
  check('dilema vacío → 400', noDecision.status === 400 && noDecision.json?.code === 'EMPTY_DECISION');

  const badMethod = await call(mainPort, '/api/analyze', {
    method: 'POST',
    body: { decision: DECISION, analysisType: 'swot' },
  });
  check('método desconocido → 400', badMethod.status === 400 && badMethod.json?.code === 'BAD_METHOD');

  const tooLong = await call(mainPort, '/api/analyze', {
    method: 'POST',
    body: { decision: 'x'.repeat(2001), analysisType: 'balance' },
  });
  check('dilema demasiado largo → 400', tooLong.status === 400 && tooLong.json?.code === 'DECISION_TOO_LONG');

  const badLens = await call(mainPort, '/api/analyze', {
    method: 'POST',
    body: { decision: DECISION, analysisType: 'balance', lens: 'y'.repeat(501) },
  });
  check('lente demasiado larga → 400', badLens.status === 400 && badLens.json?.code === 'LENS_TOO_LONG');

  const badJson = await call(mainPort, '/api/analyze', {
    method: 'POST',
    body: '{"analysisType": ',
    headers: { 'Content-Type': 'application/json' },
  });
  check('JSON roto → 400', badJson.status === 400 && badJson.json?.code === 'BAD_BODY');

  /* --------------------------------------------------------- errores upstream */

  const upstreamCases = [
    ['401', 502, 'PROVIDER_AUTH'],
    ['402', 402, 'PROVIDER_BALANCE'],
    ['403', 502, 'MODEL_UNAVAILABLE'],
    ['429', 429, 'RATE_LIMIT'],
    ['500', 502, 'PROVIDER_UNAVAILABLE'],
    ['garbage', 502, 'BAD_JSON'],
    ['incomplete', 502, 'INCOMPLETE'],
  ];

  for (const [mode, expectedStatus, expectedCode] of upstreamCases) {
    await setMode(mode);
    const response = await call(mainPort, '/api/analyze', {
      method: 'POST',
      body: { decision: DECISION, analysisType: 'balance' },
    });
    check(
      `upstream ${mode} → ${expectedStatus} ${expectedCode}`,
      response.status === expectedStatus && response.json?.code === expectedCode,
      `${response.status} ${response.json?.code}`,
    );
  }

  check(
    'error de modelo gratuito explica que hay que usar uno de pago',
    (await (async () => {
      await setMode('403');
      const response = await call(mainPort, '/api/analyze', {
        method: 'POST',
        body: { decision: DECISION, analysisType: 'balance' },
      });
      return JSON.stringify(response.json).toLowerCase().includes('pago');
    })()),
  );

  await setMode('400-on-json');
  const fallback = await call(mainPort, '/api/analyze', {
    method: 'POST',
    body: { decision: DECISION, analysisType: 'strategy' },
  });
  check('reintenta sin response_format si el modelo lo rechaza', fallback.status === 200, String(fallback.status));

  await setMode('fenced');
  const fenced = await call(mainPort, '/api/analyze', {
    method: 'POST',
    body: { decision: DECISION, analysisType: 'balance' },
  });
  check('acepta JSON envuelto en ```json', fenced.status === 200, String(fenced.status));

  /* ------------------------------------------------------------ sin clave */

  await setMode('ok');
  const noKeyAnalyze = await call(noKeyPort, '/api/analyze', {
    method: 'POST',
    body: { decision: DECISION, analysisType: 'balance' },
  });
  check('sin clave → 503 NO_KEY', noKeyAnalyze.status === 503 && noKeyAnalyze.json?.code === 'NO_KEY');

  /* ---------------------------------------------------------- rate limit */

  await setMode('ok');
  const limitBody = { decision: DECISION, analysisType: 'balance' };
  const first = await call(limitedPort, '/api/analyze', { method: 'POST', body: limitBody });
  const second = await call(limitedPort, '/api/analyze', { method: 'POST', body: limitBody });
  const third = await call(limitedPort, '/api/analyze', { method: 'POST', body: limitBody });
  check('rate limit permite las 2 primeras', first.status === 200 && second.status === 200);
  check(
    'rate limit corta la tercera con Retry-After',
    third.status === 429 && Number(third.headers.get('retry-after')) > 0,
    `${third.status} retry=${third.headers.get('retry-after')}`,
  );

  /* -------------------------------------------------------------- estático */

  if (fs.existsSync(path.join(root, 'dist', 'index.html'))) {
    const home = await fetch(`http://127.0.0.1:${mainPort}/`);
    const html = await home.text();
    check('el front compilado se sirve en /', home.status === 200 && html.includes('The Tiebreaker'), String(home.status));
    check('una ruta profunda devuelve el index (SPA)', (await fetch(`http://127.0.0.1:${mainPort}/archivo`)).status === 200);
  } else {
    console.log('SKIP  front estático (no hay dist/; ejecuta npm run build)');
  }

  const notFound = await call(mainPort, '/api/nope');
  check('API desconocida → 404 JSON', notFound.status === 404 && notFound.json?.code === 'NOT_FOUND');

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} comprobaciones OK`);
  if (failed.length) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error('test-api error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    for (const child of children) {
      try {
        child.kill();
      } catch {}
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      fs.rmSync(path.join(os.tmpdir(), 'tiebreaker-test'), { recursive: true, force: true });
    } catch {}
  });
