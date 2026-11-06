/**
 * Hook de análisis: llamada a Gemini, normalización defensiva y errores legibles.
 *
 * Nada de lo que devuelve el modelo llega a la UI sin pasar por
 * `parseAnalysisResult`: se recortan las cifras, se validan los enums, se ajustan
 * las matrices al tamaño real de opciones y criterios y se recalculan ganador y
 * segundo puesto con los totales ponderados. Si la respuesta no cumple el
 * contrato, se lanza un error legible en vez de dejar datos rotos en pantalla.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { AnalysisRequestError, requestAnalysis } from '../api';
import type {
  AnalysisEnvelope,
  AnalysisResult,
  AnalysisType,
  BalanceFactor,
  BalanceResult,
  Certainty,
  HeadToHeadCriterion,
  HeadToHeadOption,
  HeadToHeadResult,
  Horizon,
  StrategyMove,
  StrategyMoveKind,
  StrategyQuadrants,
  StrategyResult,
} from '../types/analysis';

/* -------------------------------------------------------------------------
   Límites de normalización (el contrato del prompt: 6-10 factores, 2-4
   opciones, 4-6 criterios, 4 jugadas). Se recortan para que una respuesta
   desbocada no rompa la maqueta.
   ------------------------------------------------------------------------- */

const MAX_BALANCE_FACTORS = 12;
const MAX_ASSUMPTIONS = 6;
const MAX_HEAD_TO_HEAD_OPTIONS = 4;
const MAX_CRITERIA = 6;
const MAX_QUADRANT_ITEMS = 8;
const MAX_MOVES = 4;

const BALANCE_SIDES = ['for', 'against'] as const;
const CERTAINTIES: readonly Certainty[] = ['alta', 'media', 'baja'];
const HORIZONS: readonly Horizon[] = ['corto', 'medio', 'largo'];
const MOVE_KINDS: readonly StrategyMoveKind[] = ['atacar', 'defender', 'corregir', 'mitigar'];

/* -------------------------------------------------------------------------
   Mensajes. Español de España, tuteo, sin mojibake.
   ------------------------------------------------------------------------- */

const MSG_MISSING_KEY =
  'Falta GEMINI_API_KEY: añade tu clave al archivo .env y reinicia el servidor. Mientras tanto, puedes ver la lectura del caso de ejemplo.';
const MSG_EMPTY_DECISION = 'Escribe tu dilema antes de pedir la lectura.';
const MSG_EMPTY_RESPONSE = 'La IA devolvió una respuesta vacía. Vuelve a intentarlo.';
const MSG_INVALID_JSON = 'La IA devolvió una respuesta que no es JSON válido. Vuelve a intentarlo.';
const MSG_INCOMPLETE = 'La IA devolvió una lectura incompleta para este método. Vuelve a intentarlo.';
const MSG_UNKNOWN = 'No se pudo completar el análisis. Vuelve a intentarlo.';

/* -------------------------------------------------------------------------
   Utilidades de normalización
   ------------------------------------------------------------------------- */

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readStringArray(value: unknown, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  const items: string[] = [];
  for (const entry of value) {
    const item = readText(entry);
    if (!item) continue;
    items.push(item);
    if (items.length >= maxLength) break;
  }
  return items;
}

function readEnum<const T extends readonly string[]>(value: unknown, allowed: T): T[number] | null {
  if (typeof value !== 'string') return null;
  return (allowed as readonly string[]).includes(value) ? (value as T[number]) : null;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function normalizeWeight(value: unknown): 1 | 2 | 3 {
  return clampInteger(value, 1, 3, 2) as 1 | 2 | 3;
}

function normalizePriority(value: unknown): 1 | 2 | 3 {
  return clampInteger(value, 1, 3, 2) as 1 | 2 | 3;
}

/** Error de datos: su mensaje ya está listo para mostrarse en pantalla. */
export class AnalysisValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisValidationError';
  }
}

function normalizeEnvelope(raw: UnknownRecord): AnalysisEnvelope {
  const verdict = readText(raw.verdict);
  const decisiveFactor = readText(raw.decisiveFactor);
  const openQuestion = readText(raw.openQuestion);
  const nextStep = readText(raw.nextStep);
  const assumptions = readStringArray(raw.assumptions, MAX_ASSUMPTIONS);

  if (!verdict || !decisiveFactor || !openQuestion || !nextStep || assumptions.length === 0) {
    throw new AnalysisValidationError(MSG_INCOMPLETE);
  }

  return {
    verdict,
    tilt: clampInteger(raw.tilt, -100, 100, 0),
    confidence: clampInteger(raw.confidence, 0, 100, 0),
    decisiveFactor,
    assumptions,
    openQuestion,
    nextStep,
  };
}

function normalizeBalanceResult(raw: UnknownRecord, envelope: AnalysisEnvelope): BalanceResult {
  const rawFactors = Array.isArray(raw.factors) ? raw.factors : [];
  const factors: BalanceFactor[] = [];

  for (const entry of rawFactors) {
    if (!isRecord(entry)) continue;
    const text = readText(entry.text);
    const side = readEnum(entry.side, BALANCE_SIDES);
    // Un factor sin lado no se puede colocar: se descarta antes que inventarlo.
    if (!text || !side) continue;
    factors.push({
      text,
      side,
      weight: normalizeWeight(entry.weight),
      certainty: readEnum(entry.certainty, CERTAINTIES) ?? 'media',
      horizon: readEnum(entry.horizon, HORIZONS) ?? 'medio',
    });
    if (factors.length >= MAX_BALANCE_FACTORS) break;
  }

  if (factors.length === 0) throw new AnalysisValidationError(MSG_INCOMPLETE);

  return { type: 'balance', ...envelope, factors };
}

function normalizeHeadToHeadResult(
  raw: UnknownRecord,
  envelope: AnalysisEnvelope,
): HeadToHeadResult {
  const rawOptions = Array.isArray(raw.options) ? raw.options : [];
  const rawCriteria = Array.isArray(raw.criteria) ? raw.criteria : [];

  const options: HeadToHeadOption[] = [];
  for (const entry of rawOptions) {
    if (!isRecord(entry)) continue;
    const name = readText(entry.name);
    if (!name) continue;
    options.push({ name, summary: readText(entry.summary) });
    if (options.length >= MAX_HEAD_TO_HEAD_OPTIONS) break;
  }
  if (options.length < 2) throw new AnalysisValidationError(MSG_INCOMPLETE);

  const criteria: HeadToHeadCriterion[] = [];
  for (const entry of rawCriteria) {
    if (!isRecord(entry)) continue;
    const name = readText(entry.name);
    if (!name) continue;
    criteria.push({ name, weight: normalizeWeight(entry.weight) });
    if (criteria.length >= MAX_CRITERIA) break;
  }
  if (criteria.length === 0) throw new AnalysisValidationError(MSG_INCOMPLETE);

  // La matriz se reconstruye con el tamaño real de opciones × criterios: las
  // filas/columnas de más se recortan y las que faltan quedan a 0.
  const rawScores = Array.isArray(raw.scores) ? raw.scores : [];
  const scores: number[][] = options.map((_, optionIndex) => {
    const rawRow = Array.isArray(rawScores[optionIndex]) ? (rawScores[optionIndex] as unknown[]) : [];
    return criteria.map((_, criterionIndex) =>
      clampInteger(rawRow[criterionIndex], 0, 10, 0),
    );
  });

  const totals = scores.map((row) =>
    row.reduce((sum, score, criterionIndex) => sum + score * criteria[criterionIndex].weight, 0),
  );
  const ranking = totals
    .map((total, index) => ({ total, index }))
    .sort((a, b) => b.total - a.total || a.index - b.index);

  // Los totales mandan sobre los índices que devuelve el modelo.
  const winner = ranking[0].index;
  const runnerUp = ranking[1].index;

  const tradeoff = readText(raw.tradeoff);
  if (!tradeoff) throw new AnalysisValidationError(MSG_INCOMPLETE);

  return { type: 'head-to-head', ...envelope, options, criteria, scores, winner, runnerUp, tradeoff };
}

function normalizeStrategyResult(raw: UnknownRecord, envelope: AnalysisEnvelope): StrategyResult {
  const rawQuadrants = isRecord(raw.quadrants) ? raw.quadrants : null;
  if (!rawQuadrants) throw new AnalysisValidationError(MSG_INCOMPLETE);

  const quadrants: StrategyQuadrants = {
    strengths: readStringArray(rawQuadrants.strengths, MAX_QUADRANT_ITEMS),
    weaknesses: readStringArray(rawQuadrants.weaknesses, MAX_QUADRANT_ITEMS),
    opportunities: readStringArray(rawQuadrants.opportunities, MAX_QUADRANT_ITEMS),
    threats: readStringArray(rawQuadrants.threats, MAX_QUADRANT_ITEMS),
  };
  if (
    quadrants.strengths.length === 0 ||
    quadrants.weaknesses.length === 0 ||
    quadrants.opportunities.length === 0 ||
    quadrants.threats.length === 0
  ) {
    throw new AnalysisValidationError(MSG_INCOMPLETE);
  }

  const rawMoves = Array.isArray(raw.moves) ? raw.moves : [];
  const moves: StrategyMove[] = [];
  for (const entry of rawMoves) {
    if (!isRecord(entry)) continue;
    const kind = readEnum(entry.kind, MOVE_KINDS);
    const title = readText(entry.title);
    const detail = readText(entry.detail);
    if (!kind || !title || !detail) continue;
    moves.push({ kind, title, detail, priority: normalizePriority(entry.priority) });
    if (moves.length >= MAX_MOVES) break;
  }
  if (moves.length === 0) throw new AnalysisValidationError(MSG_INCOMPLETE);

  return { type: 'strategy', ...envelope, quadrants, moves };
}

/**
 * Normaliza un objeto ya deserializado contra el contrato de datos.
 * Exportada para que el historial pueda validar lo que lee de localStorage y
 * para poder probarla sin red.
 */
export function normalizeAnalysisResult(raw: unknown, analysisType: AnalysisType): AnalysisResult {
  if (!isRecord(raw)) throw new AnalysisValidationError(MSG_INVALID_JSON);

  const envelope = normalizeEnvelope(raw);
  switch (analysisType) {
    case 'balance':
      return normalizeBalanceResult(raw, envelope);
    case 'head-to-head':
      return normalizeHeadToHeadResult(raw, envelope);
    case 'strategy':
      return normalizeStrategyResult(raw, envelope);
    default:
      throw new AnalysisValidationError(MSG_INCOMPLETE);
  }
}

/** Quita el cercado de código por si el modelo envuelve el JSON en ```json. */
function unwrapJsonPayload(payload: string): string {
  const trimmed = payload.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

/** Parsea y normaliza el texto crudo del modelo. Lanza `AnalysisValidationError`. */
export function parseAnalysisResult(payload: string, analysisType: AnalysisType): AnalysisResult {
  const cleaned = unwrapJsonPayload(payload);
  if (!cleaned) throw new AnalysisValidationError(MSG_EMPTY_RESPONSE);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AnalysisValidationError(MSG_INVALID_JSON);
  }

  return normalizeAnalysisResult(parsed, analysisType);
}

/* -------------------------------------------------------------------------
   Traducción de errores del servicio
   ------------------------------------------------------------------------- */

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

function toFriendlyError(error: unknown): string {
  if (error instanceof AnalysisValidationError) return error.message;
  // El servidor ya devuelve mensajes pensados para mostrarse tal cual.
  if (error instanceof AnalysisRequestError) return error.message || MSG_UNKNOWN;
  return MSG_UNKNOWN;
}

/* -------------------------------------------------------------------------
   Hook
   ------------------------------------------------------------------------- */

export interface UseAnalysisReturn {
  analyze: (
    decision: string,
    analysisType: AnalysisType,
    customInstructions: string,
  ) => Promise<AnalysisResult | null>;
  loadDemo: (result: AnalysisResult) => void;
  reset: () => void;
  loading: boolean;
  error: string;
  result: AnalysisResult | null;
}

export function useAnalysis(): UseAnalysisReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // El aborto al desmontar evita que una respuesta tardía toque el estado.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    inFlightRef.current = false;
    setLoading(false);
    setError('');
    setResult(null);
  }, []);

  const loadDemo = useCallback((demo: AnalysisResult) => {
    abortRef.current?.abort();
    abortRef.current = null;
    inFlightRef.current = false;
    setLoading(false);
    setError('');
    setResult(demo);
  }, []);

  const analyze = useCallback(
    async (
      decision: string,
      analysisType: AnalysisType,
      customInstructions: string,
    ): Promise<AnalysisResult | null> => {
      const trimmedDecision = decision.trim();
      if (!trimmedDecision) {
        setError(MSG_EMPTY_DECISION);
        return null;
      }
      // Doble envío: se ignora el segundo clic mientras hay una petición viva.
      if (inFlightRef.current) return null;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      inFlightRef.current = true;

      setLoading(true);
      setError('');
      setResult(null);

      const isCurrentRequest = () => abortRef.current === controller && mountedRef.current;

      try {
        const payload = await requestAnalysis(
          { decision: trimmedDecision, analysisType, lens: customInstructions },
          controller.signal,
        );
        if (!isCurrentRequest()) return null;

        const normalized = normalizeAnalysisResult(payload, analysisType);
        if (!isCurrentRequest()) return null;

        setResult(normalized);
        return normalized;
      } catch (caught: unknown) {
        // Un aborto (desmontaje, reset o carga de ejemplo) no es un error de cara al usuario.
        if (!isCurrentRequest() || controller.signal.aborted || isAbortError(caught)) {
          return null;
        }
        const friendly = toFriendlyError(caught);
        // Solo el mensaje: nunca el dilema ni la clave del usuario.
        console.error(`[useAnalysis] ${friendly}`);
        setError(friendly);
        setResult(null);
        return null;
      } finally {
        // Solo la petición vigente apaga `loading`: reset/loadDemo ya lo hicieron.
        if (abortRef.current === controller) {
          abortRef.current = null;
          inFlightRef.current = false;
          if (mountedRef.current) setLoading(false);
        }
      }
    },
    [],
  );

  return { analyze, loadDemo, reset, loading, error, result };
}
