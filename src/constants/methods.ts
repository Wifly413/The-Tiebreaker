import type { AnalysisType } from '../types/analysis';

export interface MethodSpec {
  id: AnalysisType;
  /** Etiqueta corta de la placa. */
  name: string;
  /** Qué mide, en una línea. */
  measures: string;
  /** Qué devuelve, para la columna de lectura. */
  returns: string[];
  /** Cuándo elegirlo. */
  useWhen: string;
}

export const METHODS: MethodSpec[] = [
  {
    id: 'balance',
    name: 'Balanza ponderada',
    measures: 'Pondera cada razón por impacto, certeza y plazo. La aguja marca el desempate.',
    returns: ['Factores ponderados en dos columnas', 'Inclinación neta de la balanza', 'El factor que decide'],
    useWhen: 'Un sí o un no, con pros y contras que no pesan lo mismo.',
  },
  {
    id: 'head-to-head',
    name: 'Cara a cara',
    measures: 'Enfrenta tus opciones contra criterios ponderados y las puntúa de 0 a 10.',
    returns: ['Matriz de puntuaciones', 'Ganador, margen y trade-off', 'El criterio que inclina'],
    useWhen: 'Dos o tres opciones concretas y criterios comparables.',
  },
  {
    id: 'strategy',
    name: 'Mapa estratégico',
    measures: 'Convierte el FODA en cuatro jugadas: atacar, defender, corregir y mitigar.',
    returns: ['Cuatro cuadrantes del caso', 'Cuatro jugadas priorizadas', 'El primer movimiento'],
    useWhen: 'Una situación que hay que leer antes de decidir el movimiento.',
  },
];

export const METHOD_BY_ID = Object.fromEntries(
  METHODS.map((method) => [method.id, method])
) as Record<AnalysisType, MethodSpec>;

export function methodName(type: AnalysisType): string {
  return METHOD_BY_ID[type]?.name ?? type;
}

/** Etiquetas compartidas de la lectura. */
export const READ_LABELS = {
  tiltNegative: 'En contra',
  tiltPositive: 'A favor',
  confidence: 'Confianza',
  decisive: 'Lo que inclina',
  assumptions: 'Supuestos a comprobar',
  openQuestion: 'La pregunta que falta',
  nextStep: 'Primer paso',
} as const;
