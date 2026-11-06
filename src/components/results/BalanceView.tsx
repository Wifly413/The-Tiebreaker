import type { BalanceFactor, BalanceResult, Certainty } from '../../types/analysis';
import { READ_LABELS } from '../../constants/methods';

export interface BalanceViewProps {
  result: BalanceResult;
  dense?: boolean;
}

/** Cuánto vale una certeza frente a la barra. La barra es peso × certeza. */
const CERTAINTY_FACTOR: Record<Certainty, number> = {
  alta: 1,
  media: 0.6,
  baja: 0.3,
};

const CERTAINTY_ORDER: Record<Certainty, number> = {
  alta: 3,
  media: 2,
  baja: 1,
};

const STRENGTH = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

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

function FactorList({ factors, dense }: { factors: BalanceFactor[]; dense: boolean }) {
  return (
    <ul className="divide-y divide-rule">
      {factors.map((factor, index) => {
        const strength = (factor.weight / 3) * CERTAINTY_FACTOR[factor.certainty];
        const score = factor.weight * CERTAINTY_FACTOR[factor.certainty];

        return (
          <li key={index} className={dense ? 'py-3' : 'py-4'}>
            <p className="max-w-[72ch] text-[1.0625rem] leading-[1.55] text-ink">{factor.text}</p>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <WeightTicks value={factor.weight} />
                <span className="h-3 w-px bg-rule" aria-hidden="true" />
                <span className="label">
                  certeza <span className="text-ink">{factor.certainty}</span>
                </span>
                <span className="h-3 w-px bg-rule" aria-hidden="true" />
                <span className="label">
                  horizonte <span className="text-ink">{factor.horizon}</span>
                </span>
              </div>
              <span
                className="num text-[0.6875rem] leading-none text-ink-2"
                title={`peso ${factor.weight} × certeza ${factor.certainty}`}
              >
                {STRENGTH.format(score)}
              </span>
            </div>

            <div className="mt-2 h-[2px] w-full bg-rule" aria-hidden="true">
              <span
                className="block h-full bg-ink"
                style={{ width: `${Math.round(strength * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function BalanceView({ result, dense = false }: BalanceViewProps) {
  const factors = Array.isArray(result.factors) ? result.factors : [];

  const order = (factor: BalanceFactor) =>
    factor.weight * 10 + CERTAINTY_ORDER[factor.certainty];

  const sides = [
    {
      id: 'for' as const,
      label: READ_LABELS.tiltPositive,
      factors: factors.filter((factor) => factor.side === 'for').sort((a, b) => order(b) - order(a)),
    },
    {
      id: 'against' as const,
      label: READ_LABELS.tiltNegative,
      factors: factors
        .filter((factor) => factor.side === 'against')
        .sort((a, b) => order(b) - order(a)),
    },
  ];

  return (
    <section aria-label="Factores de la balanza">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-rule pt-3">
        <h3 className="label text-ink">factores</h3>
        <p className="label">
          {factors.length} {factors.length === 1 ? 'anotado' : 'anotados'}
        </p>
      </div>

      {factors.length === 0 ? (
        <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-[1.6] text-ink-2">
          No hay factores anotados en este caso. Vuelve a lanzar el análisis para ver la balanza.
        </p>
      ) : (
        <div className={`mt-4 grid grid-cols-1 md:grid-cols-2 md:gap-x-0 ${dense ? 'gap-y-6' : 'gap-y-8'}`}>
          {sides.map((side, index) => (
            <section
              key={side.id}
              aria-label={side.label}
              className={index === 1 ? 'md:border-l md:border-rule md:pl-10' : 'md:pr-10'}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule-strong pb-2">
                <h4 className={`label ${side.id === 'for' ? 'text-for' : 'text-against'}`}>
                  {side.label}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="label">peso × certeza</span>
                  <span className="h-3 w-px bg-rule" aria-hidden="true" />
                  <span className="label">
                    {side.factors.length} {side.factors.length === 1 ? 'factor' : 'factores'}
                  </span>
                </div>
              </div>

              {side.factors.length === 0 ? (
                <p className="py-4 text-[0.9375rem] leading-[1.6] text-ink-2">
                  Sin factores en este lado.
                </p>
              ) : (
                <FactorList factors={side.factors} dense={dense} />
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
