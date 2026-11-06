/**
 * Historial local (`tiebreaker-history`).
 *
 * Contrato protegido: misma clave de localStorage y misma API pública
 * (`history, addItem, deleteItem, clearAll, exportHistory`). A partir de la
 * versión 2 se guarda `{ schema: 2, items }`.
 *
 * Los datos del formato anterior (pros-cons / comparative / swot) no se pueden
 * representar tal cual en el contrato nuevo, que exige un sobre con inclinación
 * y confianza. La migración conserva lo que era dato real del caso (factores y
 * cuadrantes, veredicto a partir de la antigua conclusión) y deja notas
 * explícitas en los campos que el formato anterior nunca registró. Las entradas
 * que no se pueden reconstruir sin inventar datos (comparative y cualquier cosa
 * corrupta) se descartan en silencio.
 */

import { useCallback, useEffect, useState } from 'react';

import type {
  AnalysisResult,
  AnalysisType,
  BalanceFactor,
  BalanceResult,
  HistoryItem,
  StrategyQuadrants,
  StrategyResult,
} from '../types/analysis';
import { normalizeAnalysisResult } from './useAnalysis';

export const HISTORY_KEY = 'tiebreaker-history';
export const HISTORY_SCHEMA = 2;
export const MAX_ENTRIES = 50;

/** Formato en disco. `schema` permite evolucionar sin romper lecturas. */
interface StoredHistory {
  schema: number;
  items: HistoryItem[];
}

/** Formato de la descarga. */
interface ExportedHistory {
  schema: number;
  exportedAt: string;
  items: HistoryItem[];
}

const LEGACY_DECISIVE_NOTE =
  'Análisis migrado del formato anterior: no registró un factor decisivo.';
const LEGACY_OPEN_QUESTION_NOTE =
  'Análisis migrado del formato anterior: no registró una pregunta abierta.';
const LEGACY_NEXT_STEP_NOTE =
  'Análisis migrado del formato anterior: no registró un primer paso.';

type UnknownRecord = Record<string, unknown>;

const ANALYSIS_TYPES: readonly AnalysisType[] = ['balance', 'head-to-head', 'strategy'];

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

function isAnalysisType(value: unknown): value is AnalysisType {
  return typeof value === 'string' && (ANALYSIS_TYPES as readonly string[]).includes(value);
}

function readTimestamp(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now();
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function localDateStamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* -------------------------------------------------------------------------
   Migración del formato anterior
   ------------------------------------------------------------------------- */

function legacyFactor(text: string, side: 'for' | 'against'): BalanceFactor {
  return { text, side, weight: 2, certainty: 'media', horizon: 'medio' };
}

/** Alterna a favor / en contra para no mostrar una columna entera primero. */
function interleaveFactors(pros: string[], cons: string[]): BalanceFactor[] {
  const factors: BalanceFactor[] = [];
  const length = Math.max(pros.length, cons.length);
  for (let index = 0; index < length; index += 1) {
    const pro = pros[index];
    if (pro) factors.push(legacyFactor(pro, 'for'));
    const con = cons[index];
    if (con) factors.push(legacyFactor(con, 'against'));
  }
  return factors;
}

function tiltFromFactors(factors: BalanceFactor[]): number {
  let positive = 0;
  let negative = 0;
  for (const factor of factors) {
    if (factor.side === 'for') positive += factor.weight;
    else negative += factor.weight;
  }
  const total = positive + negative;
  if (total === 0) return 0;
  return Math.round(((positive - negative) / total) * 100);
}

function migrateProsCons(result: UnknownRecord): BalanceResult | null {
  const conclusion = readText(result.conclusion);
  if (!conclusion) return null;

  const pros = readStringArray(result.pros, 12);
  const cons = readStringArray(result.cons, 12);
  const factors = interleaveFactors(pros, cons).slice(0, 12);
  if (factors.length === 0) return null;

  return {
    type: 'balance',
    verdict: conclusion,
    tilt: tiltFromFactors(factors),
    // El formato anterior no medía confianza; 0 lo deja explícito.
    confidence: 0,
    decisiveFactor: LEGACY_DECISIVE_NOTE,
    assumptions: [],
    openQuestion: LEGACY_OPEN_QUESTION_NOTE,
    nextStep: LEGACY_NEXT_STEP_NOTE,
    factors,
  };
}

function migrateSwot(result: UnknownRecord): StrategyResult | null {
  const conclusion = readText(result.conclusion);
  if (!conclusion) return null;

  const quadrants: StrategyQuadrants = {
    strengths: readStringArray(result.strengths, 8),
    weaknesses: readStringArray(result.weaknesses, 8),
    opportunities: readStringArray(result.opportunities, 8),
    threats: readStringArray(result.threats, 8),
  };
  const itemCount =
    quadrants.strengths.length +
    quadrants.weaknesses.length +
    quadrants.opportunities.length +
    quadrants.threats.length;
  if (itemCount === 0) return null;

  return {
    type: 'strategy',
    verdict: conclusion,
    tilt: 0,
    confidence: 0,
    decisiveFactor: LEGACY_DECISIVE_NOTE,
    assumptions: [],
    openQuestion: LEGACY_OPEN_QUESTION_NOTE,
    nextStep: LEGACY_NEXT_STEP_NOTE,
    quadrants,
    // El formato anterior no derivaba jugadas: no se inventan.
    moves: [],
  };
}

/**
 * `pros-cons` y `swot` conservan su cuerpo real. `comparative` se descarta: sus
 * "evaluaciones" son prosa y convertirlas a puntuaciones 0-10 inventaría el dato
 * que decide el método.
 */
function migrateLegacyResult(result: UnknownRecord): AnalysisResult | null {
  switch (readText(result.type)) {
    case 'pros-cons':
      return migrateProsCons(result);
    case 'swot':
      return migrateSwot(result);
    default:
      return null;
  }
}

function reviveHistoryItem(candidate: unknown): HistoryItem | null {
  if (!isRecord(candidate)) return null;

  const decision = readText(candidate.decision);
  if (!decision) return null;

  const resultRecord = isRecord(candidate.result) ? candidate.result : null;
  if (!resultRecord) return null;

  const resultType = readText(resultRecord.type);
  const customInstructions = readText(candidate.customInstructions);
  const id = readText(candidate.id) || createId();
  const timestamp = readTimestamp(candidate.timestamp);

  // Esquema actual: se vuelve a normalizar para que localStorage corrupto o
  // manual no pueda romper las vistas.
  if (isAnalysisType(resultType)) {
    try {
      const result = normalizeAnalysisResult(resultRecord, resultType);
      return { id, timestamp, decision, analysisType: resultType, customInstructions, result };
    } catch {
      return null;
    }
  }

  const migrated = migrateLegacyResult(resultRecord);
  if (!migrated) return null;

  return {
    id,
    timestamp,
    decision,
    analysisType: migrated.type,
    customInstructions,
    result: migrated,
  };
}

function extractCandidates(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed; // formato antiguo: array pelado
  if (isRecord(parsed) && Array.isArray(parsed.items)) return parsed.items;
  return [];
}

function loadHistoryFromStorage(): HistoryItem[] {
  if (typeof window === 'undefined') return [];

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(HISTORY_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const items: HistoryItem[] = [];
  for (const candidate of extractCandidates(parsed)) {
    if (items.length >= MAX_ENTRIES) break;
    const item = reviveHistoryItem(candidate);
    if (item) items.push(item);
  }
  return items;
}

/* -------------------------------------------------------------------------
   Hook
   ------------------------------------------------------------------------- */

export interface UseHistoryReturn {
  history: HistoryItem[];
  addItem: (item: HistoryItem) => void;
  deleteItem: (id: string) => void;
  clearAll: () => void;
  exportHistory: () => void;
}

export function useHistory(): UseHistoryReturn {
  const [history, setHistory] = useState<HistoryItem[]>(loadHistoryFromStorage);

  // Persiste ya en esquema 2: la primera carga migra (o descarta) lo antiguo.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const payload: StoredHistory = { schema: HISTORY_SCHEMA, items: history };
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(payload));
    } catch {
      // Sin espacio o almacenamiento bloqueado: se sigue en memoria.
    }
  }, [history]);

  const addItem = useCallback((item: HistoryItem) => {
    if (item.result.type !== item.analysisType) return;

    let result: AnalysisResult;
    try {
      result = normalizeAnalysisResult(item.result, item.analysisType);
    } catch {
      // Entrada que no cumple el contrato: no se guarda rota.
      return;
    }

    const normalizedItem: HistoryItem = { ...item, result };
    setHistory((previous) =>
      [normalizedItem, ...previous.filter((entry) => entry.id !== normalizedItem.id)].slice(
        0,
        MAX_ENTRIES,
      ),
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setHistory((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setHistory([]);
  }, []);

  const exportHistory = useCallback(() => {
    if (typeof window === 'undefined') return;

    const payload: ExportedHistory = {
      schema: HISTORY_SCHEMA,
      exportedAt: new Date().toISOString(),
      items: history,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `tiebreaker-archivo-${localDateStamp(new Date())}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [history]);

  return { history, addItem, deleteItem, clearAll, exportHistory };
}
