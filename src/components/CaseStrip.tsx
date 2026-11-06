import { PencilLine } from 'lucide-react';
import type { MethodSpec } from '../constants/methods';

interface CaseStripProps {
  decision: string;
  method: MethodSpec;
  timestamp: number | null;
  onEdit: () => void;
}

const stripDate = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/**
 * Con una lectura en pantalla, el expediente se pliega a una sola franja: la
 * lectura empieza arriba, no 1.000 px más abajo.
 */
export function CaseStrip({ decision, method, timestamp, onEdit }: CaseStripProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule py-3 sm:flex-nowrap sm:py-3.5">
      <span className="label shrink-0 text-ink">Caso</span>
      <span className="label shrink-0">{method.name}</span>
      {timestamp ? (
        <time className="label shrink-0" dateTime={new Date(timestamp).toISOString()}>
          {stripDate.format(new Date(timestamp))}
        </time>
      ) : null}
      <p className="order-last w-full truncate text-[0.875rem] text-ink-2 sm:order-none sm:w-auto sm:flex-1">
        {decision}
      </p>
      <button
        type="button"
        onClick={onEdit}
        className="mono ml-auto flex shrink-0 items-center gap-1.5 border-b border-transparent pb-0.5 text-[0.75rem] text-ink transition-colors duration-150 hover:border-ink-3"
      >
        <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
        Editar caso
      </button>
    </div>
  );
}
