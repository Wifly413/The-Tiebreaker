import type { HeadToHeadResult } from '../../types/analysis';

export interface HeadToHeadViewProps {
  result: HeadToHeadResult;
  dense?: boolean;
}

function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function WeightTicks({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-[3px]">
      <span className="sr-only">Peso {value} de 3.</span>
      {[1, 2, 3].map((tick) => (
        <span
          key={tick}
          aria-hidden="true"
          className={`h-[7px] w-[7px] ${tick <= value ? 'bg-ink' : 'bg-rule'}`}
        />
      ))}
    </span>
  );
}

export function HeadToHeadView({ result, dense = false }: HeadToHeadViewProps) {
  const options = Array.isArray(result.options) ? result.options : [];
  const criteria = Array.isArray(result.criteria) ? result.criteria : [];
  const scores = Array.isArray(result.scores) ? result.scores : [];

  const scoreOf = (optionIndex: number, criterionIndex: number): number => {
    const raw = scores[optionIndex]?.[criterionIndex];
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
    return Math.min(10, Math.max(0, Math.round(value)));
  };

  const weightSum = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  const maxTotal = weightSum * 10;
  const totals = options.map((_, optionIndex) =>
    criteria.reduce(
      (sum, criterion, criterionIndex) => sum + scoreOf(optionIndex, criterionIndex) * criterion.weight,
      0,
    ),
  );

  const bestTotal = totals.length > 0 ? Math.max(...totals) : 0;
  const isTie = totals.filter((total) => total === bestTotal).length > 1;
  const winnerIndex = totals.indexOf(bestTotal);

  const ranked = options
    .map((option, index) => ({ option, index, total: totals[index] }))
    .sort((a, b) => b.total - a.total);
  const runnerUp = ranked[1];
  const margin = runnerUp ? bestTotal - runnerUp.total : 0;

  if (options.length === 0 || criteria.length === 0) {
    return (
      <section aria-label="Matriz de puntuaciones">
        <div className="border-t border-rule pt-3">
          <h3 className="label text-ink">matriz de puntuaciones</h3>
        </div>
        <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-[1.6] text-ink-2">
          No hay matriz que mostrar en este caso. Vuelve a lanzar el análisis para comparar las
          opciones.
        </p>
      </section>
    );
  }

  const winnerColumnClass = (index: number) =>
    index === winnerIndex && !isTie ? 'border-l border-ink' : '';

  return (
    <section aria-label="Matriz de puntuaciones">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-rule pt-3">
        <h3 className="label text-ink">matriz de puntuaciones</h3>
        <p className="label">
          {isTie ? 'empate técnico' : `margen ${margin} ${margin === 1 ? 'punto' : 'puntos'}`}
        </p>
      </div>

      {!dense ? (
        <p className="mt-3 max-w-[72ch] text-[0.9375rem] leading-[1.6] text-ink-2">
          Cada criterio pesa de 1 a 3. La puntuación va de 0 a 10 y el total la multiplica por el
          peso: gana la columna con más puntos.
        </p>
      ) : null}

      {/* Escritorio: la matriz completa, con cabeceras de fila y columna. */}
      <div className="mt-4 hidden md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Puntuaciones de 0 a 10 de cada opción en cada criterio, con el total ponderado. Gana la
            opción con el total más alto.
          </caption>
          <thead>
            <tr className="border-b border-ink">
              <th scope="col" className="w-[24%] pb-2 pr-6 align-bottom">
                <span className="label">criterio</span>
              </th>
              {options.map((option, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-3 pb-2 align-bottom ${winnerColumnClass(index)}`}
                >
                  <span className="label block">opción {optionLetter(index)}</span>
                  <span className="mt-1 block text-[0.9375rem] font-semibold leading-snug text-ink">
                    {option.name}
                  </span>
                  <span className="mt-0.5 block max-w-[24ch] text-[0.75rem] leading-[1.4] text-ink-2">
                    {option.summary}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {criteria.map((criterion, criterionIndex) => (
              <tr key={criterionIndex} className="border-b border-rule">
                <th scope="row" className="py-3 pr-6 align-top">
                  <span className="block text-[0.9375rem] leading-snug text-ink">
                    {criterion.name}
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <WeightTicks value={criterion.weight} />
                    <span className="label">peso {criterion.weight}</span>
                  </span>
                </th>
                {options.map((_, optionIndex) => {
                  const score = scoreOf(optionIndex, criterionIndex);
                  return (
                    <td
                      key={optionIndex}
                      className={`px-3 py-3 align-top ${winnerColumnClass(optionIndex)}`}
                    >
                      <span className="num text-[0.9375rem] leading-none text-ink">{score}</span>
                      <span className="mt-2 block h-[2px] w-full bg-rule" aria-hidden="true">
                        <span
                          className="block h-full bg-ink"
                          style={{ width: `${score * 10}%` }}
                        />
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t border-ink">
              <th scope="row" className="pt-3 pr-6 align-top">
                <span className="label text-ink">total ponderado</span>
                <span className="label mt-1 block">máximo {maxTotal}</span>
              </th>
              {options.map((_, optionIndex) => {
                const isTop = totals[optionIndex] === bestTotal;
                return (
                  <td
                    key={optionIndex}
                    className={`px-3 pt-3 align-top ${winnerColumnClass(optionIndex)}`}
                  >
                    <span
                      className={`num text-[1.375rem] leading-none ${
                        isTop ? 'text-ink' : 'text-ink-2'
                      }`}
                    >
                      {totals[optionIndex]}
                    </span>
                    {isTop ? (
                      <span className="label mt-1 block text-ink">
                        {isTie ? 'empate' : 'gana'}
                      </span>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Móvil: la misma información en bloques por opción, sin scroll horizontal. */}
      <ul className="mt-4 md:hidden">
        {ranked.map(({ option, index, total }, position) => {
          const isWinner = index === winnerIndex && !isTie;
          return (
            <li key={index} className="border-b border-rule py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-[1.0625rem] font-semibold leading-snug text-ink">
                    {optionLetter(index)}. {option.name}
                  </h4>
                  <p className="mt-0.5 max-w-[34ch] text-[0.8125rem] leading-[1.4] text-ink-2">
                    {option.summary}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`num text-[1.5rem] leading-none ${isWinner ? 'text-ink' : 'text-ink-2'}`}>
                    {total}
                  </p>
                  <p className="label mt-1">{isWinner ? 'gana' : `puesto ${position + 1}`}</p>
                </div>
              </div>

              <ul className="mt-3 space-y-1.5">
                {criteria.map((criterion, criterionIndex) => {
                  const score = scoreOf(index, criterionIndex);
                  return (
                    <li key={criterionIndex} className="flex items-center justify-between gap-3">
                      <span className="text-[0.8125rem] leading-snug text-ink-2">
                        {criterion.name}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="h-[2px] w-14 bg-rule" aria-hidden="true">
                          <span
                            className="block h-full bg-ink"
                            style={{ width: `${score * 10}%` }}
                          />
                        </span>
                        <span className="num w-4 text-right text-[0.8125rem] text-ink">
                          {score}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 border-t border-rule pt-4">
        <h4 className="label">qué se sacrifica</h4>
        <p className="mt-1.5 max-w-[72ch] text-[1.0625rem] leading-[1.6] text-ink">
          {result.tradeoff}
        </p>
      </div>
    </section>
  );
}
