/**
 * Configuración del servidor. Todo se lee de variables de entorno para que el
 * despliegue (Render) solo tenga que definir secretos, nunca tocar código.
 *
 * Proveedor por defecto: OpenCode Console (gateway compatible con OpenAI).
 *   POST https://opencode.ai/inference/openai/v1/chat/completions
 *   Authorization: Bearer <OPENCODE_API_KEY>
 */

const DEFAULTS = {
  baseUrl: 'https://opencode.ai/inference/openai/v1',
  model: 'deepseek-v4.1-flash',
  temperature: 0.5,
  timeoutMs: 60_000,
  jsonMode: 'json_object',
  windowMs: 10 * 60_000,
  maxPerWindow: 8,
  dailyLimit: 300,
};

function readNumber(env, name, fallback) {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function readConfig(env = process.env) {
  return {
    port: readNumber(env, 'PORT', 3001),
    apiKey: typeof env.OPENCODE_API_KEY === 'string' ? env.OPENCODE_API_KEY.trim() : '',
    baseUrl: (env.OPENCODE_BASE_URL || DEFAULTS.baseUrl).replace(/\/+$/, ''),
    model: (env.OPENCODE_MODEL || DEFAULTS.model).trim(),
    temperature: readNumber(env, 'OPENCODE_TEMPERATURE', DEFAULTS.temperature),
    timeoutMs: readNumber(env, 'OPENCODE_TIMEOUT_MS', DEFAULTS.timeoutMs),
    jsonMode: env.OPENCODE_JSON_MODE === 'none' ? 'none' : DEFAULTS.jsonMode,
    rateLimit: {
      windowMs: readNumber(env, 'RATE_LIMIT_WINDOW_MS', DEFAULTS.windowMs),
      max: readNumber(env, 'RATE_LIMIT_MAX', DEFAULTS.maxPerWindow),
    },
    dailyLimit: readNumber(env, 'DAILY_LIMIT', DEFAULTS.dailyLimit),
    distDir: env.DIST_DIR || 'dist',
  };
}

export function isProviderConfigured(config) {
  return Boolean(config.apiKey);
}

/** Nunca se registra la clave ni el texto del usuario. */
export function describeConfig(config) {
  return {
    provider: 'opencode',
    model: config.model,
    baseUrl: config.baseUrl,
    temperature: config.temperature,
    jsonMode: config.jsonMode,
    key: config.apiKey ? 'configurada' : 'ausente',
    rateLimit: `${config.rateLimit.max}/${Math.round(config.rateLimit.windowMs / 60000)} min`,
    dailyLimit: config.dailyLimit,
  };
}
