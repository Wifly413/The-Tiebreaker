/**
 * Contrato de datos de The Tiebreaker.
 *
 * Los tres métodos comparten un sobre (`AnalysisEnvelope`) que es la "lectura":
 * veredicto, inclinación, confianza, factor decisivo, supuestos, pregunta abierta
 * y primer paso. Cada método añade su cuerpo propio.
 *
 * Importante: `tilt` y `confidence` son enteros. La UI los recorta igualmente
 * (clamp) porque una respuesta del modelo nunca debe poder romper el diseño.
 */

export type AnalysisType = 'balance' | 'head-to-head' | 'strategy';

/** Certeza de un factor: hecho verificable, inferencia razonable o especulación. */
export type Certainty = 'alta' | 'media' | 'baja';

/** Cuándo se nota el efecto de un factor. */
export type Horizon = 'corto' | 'medio' | 'largo';

/** Lo que comparten los tres métodos. */
export interface AnalysisEnvelope {
  /** Recomendación en 1-2 frases, en voz activa. */
  verdict: string;
  /** Lectura neta: -100 (en contra) … 0 (empate) … +100 (a favor). */
  tilt: number;
  /** Confianza honesta de la lectura, 0-100. */
  confidence: number;
  /** El único factor que, si cambiara, cambiaría el veredicto. */
  decisiveFactor: string;
  /** Supuestos comprobables en los que se apoya la lectura. */
  assumptions: string[];
  /** La pregunta cuya respuesta reduciría más la incertidumbre. */
  openQuestion: string;
  /** Acción concreta para esta semana, de menos de una hora. */
  nextStep: string;
}

/** --- 1. Balanza ponderada ------------------------------------------------ */

export interface BalanceFactor {
  /** La razón concreta, con los datos del caso. */
  text: string;
  side: 'for' | 'against';
  /** 1 = táctico, 2 = importante, 3 = estructural. */
  weight: 1 | 2 | 3;
  certainty: Certainty;
  horizon: Horizon;
}

export interface BalanceResult extends AnalysisEnvelope {
  type: 'balance';
  factors: BalanceFactor[];
}

/** --- 2. Cara a cara ----------------------------------------------------- */

export interface HeadToHeadOption {
  name: string;
  /** Retrato honesto en 12 palabras o menos. */
  summary: string;
}

export interface HeadToHeadCriterion {
  name: string;
  /** 1 = deseable, 2 = importante, 3 = eliminatorio. */
  weight: 1 | 2 | 3;
}

export interface HeadToHeadResult extends AnalysisEnvelope {
  type: 'head-to-head';
  options: HeadToHeadOption[];
  criteria: HeadToHeadCriterion[];
  /** scores[opción][criterio] = 0-10 */
  scores: number[][];
  /** Índice de la opción ganadora. */
  winner: number;
  /** Índice de la opción segunda. */
  runnerUp: number;
  /** Qué sacrifica quien elige al ganador. */
  tradeoff: string;
}

/** --- 3. Mapa estratégico ------------------------------------------------ */

export interface StrategyQuadrants {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export type StrategyMoveKind = 'atacar' | 'defender' | 'corregir' | 'mitigar';

export interface StrategyMove {
  /** atacar = F×O · defender = F×A · corregir = D×O · mitigar = D×A */
  kind: StrategyMoveKind;
  title: string;
  /** Conecta un factor interno con uno externo y dice qué hacer esta semana. */
  detail: string;
  priority: 1 | 2 | 3;
}

export interface StrategyResult extends AnalysisEnvelope {
  type: 'strategy';
  quadrants: StrategyQuadrants;
  moves: StrategyMove[];
}

export type AnalysisResult = BalanceResult | HeadToHeadResult | StrategyResult;

/** --- Archivo ------------------------------------------------------------ */

/** Caso de ejemplo precargado (no llama a la API). */
export interface DemoCase {
  decision: string;
  result: AnalysisResult;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  decision: string;
  analysisType: AnalysisType;
  customInstructions: string;
  result: AnalysisResult;
}
