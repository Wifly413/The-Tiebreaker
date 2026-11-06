/**
 * Cliente de la API propia. El navegador nunca habla con el proveedor de IA ni
 * ve su clave: solo llama a `/api/*` en el mismo origen.
 */

import type { AnalysisType } from './types/analysis';

export interface ServiceStatus {
  ready: boolean;
  provider: string;
  model: string;
  version?: string;
}

export interface AnalysisMeta {
  model: string;
  ms: number;
  cost: number | null;
}

export class AnalysisRequestError extends Error {
  status: number;
  code: string;

  constructor(message: string, { status = 0, code = 'REQUEST_FAILED' } = {}) {
    super(message);
    this.name = 'AnalysisRequestError';
    this.status = status;
    this.code = code;
  }
}

const MESSAGES_BY_STATUS: Record<number, string> = {
  400: 'La petición no es válida. Revisa el dilema y vuelve a intentarlo.',
  413: 'El texto enviado es demasiado largo.',
  429: 'Demasiadas lecturas seguidas. Espera unos minutos y vuelve a intentarlo.',
  502: 'El proveedor de IA no ha devuelto una lectura válida. Vuelve a intentarlo.',
  503: 'El servicio de análisis no está disponible ahora mismo.',
  504: 'El proveedor ha tardado demasiado en responder. Vuelve a intentarlo.',
};

function friendlyMessage(status: number): string {
  return MESSAGES_BY_STATUS[status] ?? 'No se pudo completar el análisis. Vuelve a intentarlo.';
}

export async function fetchServiceStatus(signal?: AbortSignal): Promise<ServiceStatus | null> {
  try {
    const response = await fetch('/api/health', { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const data = (await response.json()) as ServiceStatus;
    if (!data || typeof data.ready !== 'boolean') return null;
    return data;
  } catch {
    return null;
  }
}

export interface AnalysisRequest {
  decision: string;
  analysisType: AnalysisType;
  lens?: string;
}

/**
 * Pide una lectura al servidor. Devuelve el JSON crudo del modelo: la
 * normalización (rangos, enums, ganador) la hace `useAnalysis`.
 */
export async function requestAnalysis(
  input: AnalysisRequest,
  signal?: AbortSignal,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        decision: input.decision,
        analysisType: input.analysisType,
        lens: input.lens ?? '',
      }),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AnalysisRequestError(
      'No se pudo conectar con el servicio de análisis. Comprueba tu conexión e inténtalo de nuevo.',
      { status: 0, code: 'NETWORK' },
    );
  }

  const data = (await response.json().catch(() => null)) as
    | { result?: unknown; error?: string; code?: string }
    | null;

  if (!response.ok) {
    throw new AnalysisRequestError(data?.error || friendlyMessage(response.status), {
      status: response.status,
      code: data?.code || 'HTTP_ERROR',
    });
  }

  if (!data || typeof data !== 'object' || !('result' in data)) {
    throw new AnalysisRequestError(
      'El servidor devolvió una respuesta inesperada. Vuelve a intentarlo.',
      { status: 502, code: 'BAD_RESPONSE' },
    );
  }

  return data.result;
}
