import type { AnalysisResult } from '../types/analysis';
import type { MethodSpec } from '../constants/methods';
import { Beam } from './Beam';

interface ReadoutRailProps {
  method: MethodSpec;
  latest: AnalysisResult | null;
  onJumpToResult: () => void;
}

export function ReadoutRail({ method, latest, onJumpToResult }: ReadoutRailProps) {
  return (
    <aside aria-label="Lectura" className="lg:sticky lg:top-24">
      <div className="flex items-baseline justify-between border-b border-rule pb-2">
        <h2 className="label">Lectura</h2>
        <span className="label">{latest ? 'última' : 'sin calcular'}</span>
      </div>

      <div className="pt-6">
        <Beam tilt={latest ? latest.tilt : 0} size="md" showReadout={Boolean(latest)} />
        <p className="mt-4 max-w-[34ch] text-[0.8125rem] leading-[1.5] text-ink-2">
          La aguja se inclina cuando el método termina. Si queda nivelada, el caso está
          empatado y la decisión depende de un criterio que todavía no has escrito.
        </p>
        {latest && (
          <button
            type="button"
            onClick={onJumpToResult}
            className="mono mt-3 border-b border-ink-3 pb-0.5 text-[0.75rem] text-ink transition-colors duration-150 hover:border-signal hover:text-signal"
          >
            Ir a la lectura completa
          </button>
        )}
      </div>

      <div className="mt-8 border-t border-rule pt-4">
        <h3 className="label">{method.name}</h3>
        <p className="mt-2 text-[0.8125rem] leading-[1.5] text-ink-2">{method.measures}</p>
        <ul className="mt-4">
          {method.returns.map((item) => (
            <li key={item} className="border-b border-rule py-2">
              <span className="text-[0.8125rem] leading-snug text-ink">{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-[34ch] text-[0.75rem] leading-[1.5] text-ink-2">
          {method.useWhen}
        </p>
      </div>

      <p className="label mt-8 border-t border-rule pt-4 leading-[1.6]">
        El archivo se guarda solo en este navegador. El texto del dilema se envía al modelo a
        través del servidor de la app; la clave del proveedor no llega aquí.
      </p>
    </aside>
  );
}
