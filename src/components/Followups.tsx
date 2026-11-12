import type { AnalysisResult } from '../types/analysis';
import { READ_LABELS } from '../constants/methods';

export interface FollowupsProps {
  result: AnalysisResult;
  dense?: boolean;
}

/**
 * Cierre de la lectura: qué se da por hecho, qué falta por saber y qué se hace
 * esta semana. Tres bloques, tres filetes, ninguna tarjeta.
 */
export function Followups({ result, dense = false }: FollowupsProps) {
  const assumptions = Array.isArray(result.assumptions)
    ? result.assumptions.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
  const openQuestion = typeof result.openQuestion === 'string' ? result.openQuestion.trim() : '';
  const nextStep = typeof result.nextStep === 'string' ? result.nextStep.trim() : '';

  const blockPadding = dense ? 'pt-2.5' : 'pt-3';

  return (
    <section aria-label="Siguientes comprobaciones" className="grid gap-x-10 gap-y-8 md:grid-cols-3">
      <div className={`border-t border-rule ${blockPadding}`}>
        <h3 className="label">{READ_LABELS.assumptions}</h3>
        {assumptions.length > 0 ? (
          <ul className="mt-1">
            {assumptions.map((assumption, index) => (
              <li key={index} className="border-b border-rule py-2">
                <span className="max-w-[62ch] text-[0.9375rem] leading-[1.5] text-ink">
                  {assumption}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[0.9375rem] leading-[1.5] text-ink-2">
            Este análisis no declara supuestos.
          </p>
        )}
      </div>

      <div className={`border-t border-rule ${blockPadding}`}>
        <h3 className="label">{READ_LABELS.openQuestion}</h3>
        {openQuestion ? (
          <p className="mt-2 max-w-[46ch] text-[1.0625rem] leading-[1.5] text-ink">{openQuestion}</p>
        ) : (
          <p className="mt-2 text-[0.9375rem] leading-[1.5] text-ink-2">
            No hay una pregunta abierta registrada.
          </p>
        )}
      </div>

      <div className="border-t-2 border-ink pt-3">
        <h3 className="label">{READ_LABELS.nextStep}</h3>
        {nextStep ? (
          <p className="mt-2 max-w-[46ch] text-[1.0625rem] font-semibold leading-[1.5] text-ink">
            {nextStep}
          </p>
        ) : (
          <p className="mt-2 text-[0.9375rem] leading-[1.5] text-ink-2">
            Todavía no hay un primer paso definido.
          </p>
        )}
      </div>
    </section>
  );
}
