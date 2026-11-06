/**
 * Cliente del proveedor: OpenCode Console (API compatible con OpenAI Chat
 * Completions). Sin SDK: una llamada `fetch` y un contrato JSON explícito.
 */

export class UpstreamError extends Error {
  constructor(message, { code = 'PROVIDER_ERROR', status = 502, retryAfter = null, cause } = {}) {
    super(message);
    this.name = 'UpstreamError';
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
    this.cause = cause;
  }
}

const FRIENDLY = {
  auth: 'La clave del proveedor no es válida o ha caducado (OPENCODE_API_KEY).',
  model:
    'El proveedor rechazó la petición (403/404). Comprueba que OPENCODE_MODEL es un modelo de pago: los modelos gratuitos de OpenCode solo funcionan dentro de OpenCode.',
  rate: 'El proveedor ha limitado las peticiones (429). Espera un minuto y vuelve a intentarlo.',
  rejected: 'El proveedor ha rechazado la petición. Vuelve a intentarlo o cambia de modelo.',
  unavailable: 'El proveedor no está disponible ahora mismo. Vuelve a intentarlo en unos instantes.',
  timeout: 'El proveedor ha tardado demasiado en responder. Vuelve a intentarlo.',
  network: 'No se pudo conectar con el proveedor de IA. Comprueba la conexión del servidor.',
  empty: 'El proveedor devolvió una respuesta vacía. Vuelve a intentarlo.',
  truncated: 'El proveedor cortó la respuesta antes de terminar. Vuelve a intentarlo.',
  shape: 'El proveedor devolvió una respuesta que no cumple el formato esperado.',
};

function extractText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part.text === 'string') return part.text;
        return '';
      })
      .join('');
  }
  return '';
}

async function requestCompletion(messages, config, signal, useJsonMode) {
  const endpoint = `${config.baseUrl}/chat/completions`;
  const body = {
    model: config.model,
    messages,
    temperature: config.temperature,
  };
  if (useJsonMode) body.response_format = { type: 'json_object' };

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new UpstreamError(FRIENDLY.network, { code: 'NETWORK', status: 502, cause: error });
  }

  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    let detail = '';
    try {
      const parsed = JSON.parse(raw);
      detail = parsed?.error?.message || parsed?.message || '';
    } catch {
      detail = raw.slice(0, 400);
    }

    if (response.status === 400 && useJsonMode) {
      // Algunos modelos del gateway no aceptan response_format: se reintenta una vez sin él.
      return { retryWithoutJsonMode: true, status: response.status };
    }
    if (response.status === 401) {
      throw new UpstreamError(FRIENDLY.auth, { code: 'PROVIDER_AUTH', status: 502 });
    }
    if (response.status === 403 || response.status === 404) {
      throw new UpstreamError(FRIENDLY.model, { code: 'MODEL_UNAVAILABLE', status: 502 });
    }
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('retry-after')) || null;
      throw new UpstreamError(FRIENDLY.rate, { code: 'RATE_LIMIT', status: 429, retryAfter });
    }
    if (response.status >= 500) {
      throw new UpstreamError(FRIENDLY.unavailable, { code: 'PROVIDER_UNAVAILABLE', status: 502 });
    }
    throw new UpstreamError(
      detail ? `${FRIENDLY.rejected} (${response.status}: ${detail.slice(0, 160)})` : FRIENDLY.rejected,
      { code: 'PROVIDER_REJECTED', status: 502 },
    );
  }

  const data = await response.json().catch(() => null);
  if (!data || !Array.isArray(data.choices) || data.choices.length === 0) {
    throw new UpstreamError(FRIENDLY.shape, { code: 'BAD_RESPONSE', status: 502 });
  }

  const choice = data.choices[0];
  const text = extractText(choice?.message?.content).trim();
  if (!text) {
    throw new UpstreamError(
      choice?.finish_reason === 'length' ? FRIENDLY.truncated : FRIENDLY.empty,
      { code: 'EMPTY_RESPONSE', status: 502 },
    );
  }
  if (choice?.finish_reason === 'length') {
    throw new UpstreamError(FRIENDLY.truncated, { code: 'TRUNCATED', status: 502 });
  }

  return {
    text,
    usage: data.usage ?? null,
    model: data.model || config.model,
    choice,
  };
}

/**
 * Llama al proveedor y devuelve el texto crudo del modelo (JSON en teoría).
 * @param {Array<{role: string, content: string}>} messages
 * @param {ReturnType<import('./config.mjs').readConfig>} config
 * @param {AbortSignal} [signal]
 */
export async function createCompletion(messages, config, signal) {
  if (!config.apiKey) {
    throw new UpstreamError(
      'El servidor no tiene configurada la clave del proveedor (OPENCODE_API_KEY).',
      { code: 'NO_KEY', status: 503 },
    );
  }

  const timeoutSignal = AbortSignal.timeout(config.timeoutMs);
  const composed = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  try {
    const first = await requestCompletion(messages, config, composed, config.jsonMode !== 'none');
    if (!first.retryWithoutJsonMode) return first;

    const second = await requestCompletion(messages, config, composed, false);
    return second;
  } catch (error) {
    if (timeoutSignal.aborted && !signal?.aborted) {
      throw new UpstreamError(FRIENDLY.timeout, { code: 'TIMEOUT', status: 504 });
    }
    throw error;
  }
}
