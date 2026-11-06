import { methodName } from '../constants/methods';
import type {
  AnalysisEnvelope,
  AnalysisResult,
  BalanceResult,
  HeadToHeadResult,
  StrategyResult,
} from '../types/analysis';

/**
 * Markdown limpio para pegar en notas: título con la decisión, método, lectura
 * (inclinación, confianza, veredicto, factor decisivo), cuerpo del método,
 * supuestos, pregunta abierta y primer paso. Sin emoji y sin HTML.
 */

const NUMBER_FORMATTER = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(Number.isFinite(value) ? value : 0);
}

/** Colapsa saltos y espacios porque los campos del modelo son de una frase. */
function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Celda de tabla Markdown: el pipe partiría la columna. */
function escapeCell(value: string): string {
  return oneLine(value).replace(/\|/g, '\\|');
}

function tiltReading(tilt: number): string {
  if (tilt > 0) return 'a favor';
  if (tilt < 0) return 'en contra';
  return 'empate';
}

function formatTilt(tilt: number): string {
  const value = Number.isFinite(tilt) ? Math.round(tilt) : 0;
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumber(value)} / 100`;
}

function buildHeader(decision: string, result: AnalysisResult): string[] {
  const title = oneLine(decision) || 'Decisión sin título';
  return [`# ${title}`, '', `**Método:** ${methodName(result.type)}`, ''];
}

function buildReading(result: AnalysisEnvelope): string[] {
  return [
    '## Lectura',
    '',
    `- **Inclinación:** ${formatTilt(result.tilt)} (${tiltReading(result.tilt)})`,
    `- **Confianza:** ${formatNumber(result.confidence)} / 100`,
    `- **Veredicto:** ${oneLine(result.verdict)}`,
    `- **Factor decisivo:** ${oneLine(result.decisiveFactor)}`,
    '',
  ];
}

function buildBalanceBody(result: BalanceResult): string[] {
  const lines: string[] = ['## Factores', ''];
  const sides: Array<{ title: string; factors: BalanceResult['factors'] }> = [
    { title: 'A favor', factors: result.factors.filter((factor) => factor.side === 'for') },
    { title: 'En contra', factors: result.factors.filter((factor) => factor.side === 'against') },
  ];

  for (const side of sides) {
    lines.push(`### ${side.title} (${side.factors.length})`, '');
    if (side.factors.length === 0) {
      lines.push('Sin factores anotados.', '');
      continue;
    }
    for (const factor of side.factors) {
      lines.push(
        `- ${oneLine(factor.text)} (peso ${factor.weight}, certeza ${factor.certainty}, horizonte ${factor.horizon})`,
      );
    }
    lines.push('');
  }

  return lines;
}

function buildHeadToHeadBody(result: HeadToHeadResult): string[] {
  const lines: string[] = ['## Opciones', ''];

  result.options.forEach((option, index) => {
    const marks: string[] = [];
    if (index === result.winner) marks.push('opción elegida');
    else if (index === result.runnerUp) marks.push('segunda opción');
    const suffix = marks.length > 0 ? ` (${marks.join(', ')})` : '';
    lines.push(`- **${oneLine(option.name)}**${suffix}: ${oneLine(option.summary)}`);
  });
  lines.push('');

  const scoreOf = (optionIndex: number, criterionIndex: number): number => {
    const row = result.scores[optionIndex];
    const rawScore = row ? row[criterionIndex] : undefined;
    return typeof rawScore === 'number' && Number.isFinite(rawScore) ? rawScore : 0;
  };

  const totals = result.options.map((_, optionIndex) =>
    result.criteria.reduce(
      (sum, criterion, criterionIndex) => sum + scoreOf(optionIndex, criterionIndex) * criterion.weight,
      0,
    ),
  );

  lines.push('## Matriz de puntuaciones', '');
  lines.push(`| Criterio | Peso | ${result.options.map((option) => escapeCell(option.name)).join(' | ')} |`);
  lines.push(`| --- | --- | ${result.options.map(() => '---').join(' | ')} |`);

  result.criteria.forEach((criterion, criterionIndex) => {
    const cells = result.options.map((_, optionIndex) =>
      formatNumber(scoreOf(optionIndex, criterionIndex)),
    );
    lines.push(`| ${escapeCell(criterion.name)} | ${criterion.weight} | ${cells.join(' | ')} |`);
  });
  lines.push(`| **Total ponderado** |  | ${totals.map(formatNumber).join(' | ')} |`);
  lines.push('');

  const winner = result.options[result.winner];
  if (winner) {
    lines.push(
      `**Opción elegida:** ${oneLine(winner.name)} (${formatNumber(totals[result.winner] ?? 0)} puntos ponderados).`,
    );
  }
  lines.push(`**Qué se sacrifica:** ${oneLine(result.tradeoff)}`, '');

  return lines;
}

function buildStrategyBody(result: StrategyResult): string[] {
  const lines: string[] = ['## Cuadrantes', ''];
  const quadrants: Array<{ title: string; items: string[] }> = [
    { title: 'Fortalezas', items: result.quadrants.strengths },
    { title: 'Debilidades', items: result.quadrants.weaknesses },
    { title: 'Oportunidades', items: result.quadrants.opportunities },
    { title: 'Amenazas', items: result.quadrants.threats },
  ];

  for (const quadrant of quadrants) {
    lines.push(`### ${quadrant.title}`, '');
    if (quadrant.items.length === 0) {
      lines.push('Sin ítems anotados.', '');
      continue;
    }
    for (const item of quadrant.items) {
      lines.push(`- ${oneLine(item)}`);
    }
    lines.push('');
  }

  lines.push('## Jugadas', '');
  if (result.moves.length === 0) {
    lines.push('Análisis migrado: el formato anterior no registró jugadas.', '');
  } else {
    const orderedMoves = [...result.moves].sort((a, b) => a.priority - b.priority);
    orderedMoves.forEach((move, index) => {
      lines.push(`${index + 1}. **${oneLine(move.title)}** (${move.kind}, prioridad ${move.priority})`);
      lines.push(`   ${oneLine(move.detail)}`);
      lines.push('');
    });
  }

  return lines;
}

function buildFollowups(result: AnalysisEnvelope): string[] {
  const lines: string[] = [];

  if (result.assumptions.length > 0) {
    lines.push('## Supuestos a comprobar', '');
    result.assumptions.forEach((assumption) => {
      lines.push(`- ${oneLine(assumption)}`);
    });
    lines.push('');
  }

  const openQuestion = oneLine(result.openQuestion);
  if (openQuestion) {
    lines.push('## La pregunta que falta', '', openQuestion, '');
  }

  const nextStep = oneLine(result.nextStep);
  if (nextStep) {
    lines.push('## Primer paso', '', nextStep, '');
  }

  return lines;
}

export function formatResultForClipboard(decision: string, result: AnalysisResult): string {
  const lines: string[] = [...buildHeader(decision, result), ...buildReading(result)];

  if (result.type === 'balance') {
    lines.push(...buildBalanceBody(result));
  } else if (result.type === 'head-to-head') {
    lines.push(...buildHeadToHeadBody(result));
  } else {
    lines.push(...buildStrategyBody(result));
  }

  lines.push(...buildFollowups(result));

  const text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return `${text}\n`;
}
