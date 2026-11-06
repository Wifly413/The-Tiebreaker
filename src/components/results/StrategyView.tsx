import type { StrategyMove, StrategyResult } from '../../types/analysis';

export interface StrategyViewProps {
  result: StrategyResult;
  dense?: boolean;
}

/** Cada jugada cruza un cuadrante interno con uno externo. */
const MOVE_PAIR: Record<StrategyMove['kind'], string> = {
  atacar: 'F × O',
  defender: 'F × A',
  corregir: 'D × O',
  mitigar: 'D × A',
};

const QUADRANT_LABELS: Array<{
  key: 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
  letter: string;
  label: string;
}> = [
  { key: 'strengths', letter: 'F', label: 'fortalezas' },
  { key: 'weaknesses', letter: 'D', label: 'debilidades' },
  { key: 'opportunities', letter: 'O', label: 'oportunidades' },
  { key: 'threats', letter: 'A', label: 'amenazas' },
];

function PriorityMark({ value }: { value: number }) {
  const surface =
    value === 1
      ? 'border-ink text-ink'
      : value === 2
        ? 'border-rule-strong text-ink-2'
        : 'border-rule text-ink-3';

  return (
    <span
      className={`mono border px-1.5 py-0.5 text-[0.6875rem] leading-none ${surface}`}
      title={`Prioridad ${value} de 3`}
    >
      {value}
    </span>
  );
}

export function StrategyView({ result, dense = false }: StrategyViewProps) {
  const quadrants = result.quadrants ?? {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  };

  const moves = Array.isArray(result.moves)
    ? [...result.moves].sort((a, b) => a.priority - b.priority)
    : [];

  const totalItems = QUADRANT_LABELS.reduce(
    (sum, quadrant) => sum + (Array.isArray(quadrants[quadrant.key]) ? quadrants[quadrant.key].length : 0),
    0,
  );

  return (
    <section aria-label="Mapa estratégico">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-rule pt-3">
        <h3 className="label text-ink">cuadrantes</h3>
        <p className="label">Arriba, lo interno; abajo, lo externo.</p>
      </div>

      {totalItems === 0 ? (
        <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-[1.6] text-ink-2">
          No hay cuadrantes anotados en este caso. Vuelve a lanzar el análisis para leer la situación.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 border-l border-t border-rule sm:grid-cols-2">
          {QUADRANT_LABELS.map((quadrant) => {
            const items = Array.isArray(quadrants[quadrant.key]) ? quadrants[quadrant.key] : [];
            return (
              <div
                key={quadrant.key}
                className={`border-b border-r border-rule ${dense ? 'p-3' : 'p-3 sm:p-4'}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="label text-ink">{quadrant.label}</h4>
                  <span className="num text-[0.75rem] leading-none text-ink-3">
                    {quadrant.letter}
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="mt-2 text-[0.75rem] leading-[1.4] text-ink-2">Sin ítems.</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {items.map((item, index) => (
                      <li key={index} className="flex gap-1.5">
                        <span className="num shrink-0 pt-[3px] text-[0.625rem] leading-none text-ink-2">
                          {quadrant.letter}
                          {index + 1}
                        </span>
                        <span className="text-[0.8125rem] leading-[1.4] text-ink">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-rule pt-3">
        <h3 className="label text-ink">jugadas</h3>
        <p className="label">
          {moves.length} {moves.length === 1 ? 'jugada' : 'jugadas'}, por prioridad
        </p>
      </div>

      {moves.length === 0 ? (
        <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-[1.6] text-ink-2">
          No hay jugadas registradas en este caso.
        </p>
      ) : (
        <ol className="mt-2">
          {moves.map((move, index) => {
            const edge =
              move.priority === 1
                ? 'border-l-2 border-l-ink'
                : move.priority === 2
                  ? 'border-l border-l-rule-strong'
                  : 'border-l border-l-rule';

            return (
              <li key={index} className={`border-b border-rule ${edge} pl-4 ${dense ? 'py-3' : 'py-4'}`}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="label text-ink">{move.kind}</span>
                    <span className="label text-ink-3">{MOVE_PAIR[move.kind]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="label">prioridad</span>
                    <PriorityMark value={move.priority} />
                  </div>
                </div>

                <h4 className="mt-1.5 text-[1.1875rem] font-semibold leading-snug tracking-[-0.01em] text-ink">
                  {move.title}
                </h4>
                <p className="mt-1 max-w-[72ch] text-[1.0625rem] leading-[1.55] text-ink">
                  {move.detail}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
