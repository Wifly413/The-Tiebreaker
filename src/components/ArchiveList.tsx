import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, Undo2 } from 'lucide-react';
import type { HistoryItem } from '../types/analysis';
import { methodName } from '../constants/methods';
import { AnalysisView } from './AnalysisView';
import { CopyButton } from './CopyButton';
import { formatResultForClipboard } from '../utils/formatClipboard';

const shortDate = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
const longDate = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

interface ArchiveListProps {
  history: HistoryItem[];
  onDelete: (id: string) => void;
  onRestore: (item: HistoryItem, index: number) => void;
  onStartNew: () => void;
}

export function ArchiveList({ history, onDelete, onRestore, onStartNew }: ArchiveListProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ item: HistoryItem; index: number } | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (openId && !history.some((item) => item.id === openId)) setOpenId(null);
  }, [history, openId]);

  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  const handleDelete = (item: HistoryItem, index: number) => {
    onDelete(item.id);
    setLastDeleted({ item, index });
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setLastDeleted(null), 8000);
  };

  const handleUndo = () => {
    if (!lastDeleted) return;
    window.clearTimeout(undoTimer.current);
    onRestore(lastDeleted.item, lastDeleted.index);
    setLastDeleted(null);
  };

  if (history.length === 0) {
    return (
      <div className="py-14 sm:py-20">
        <p className="mono text-[0.6875rem] text-ink-2">Archivo vacío</p>
        <h2 className="mt-3 max-w-[24ch] text-[1.25rem] font-semibold leading-snug">
          Aquí se acumulan las lecturas que vayas guardando.
        </h2>
        <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-[1.6] text-ink-2">
          Cada análisis se guarda en este navegador con su veredicto, su inclinación y su primer
          paso. Nada se envía a ningún servidor.
        </p>
        <button type="button" onClick={onStartNew} className="btn btn-quiet mt-6">
          <span className="mono text-[0.6875rem]">Empezar un caso</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="label mb-2 pt-3">
        La cifra de la derecha es la inclinación de la aguja. Abre una fila para leerla entera.
      </p>
      {history.map((item, index) => {
        const open = openId === item.id;
        const tilt = Math.round(item.result.tilt);
        const date = new Date(item.timestamp);
        return (
          <article key={item.id} className="border-b border-rule">
            <div className="group flex items-start gap-3 py-4 sm:gap-5 sm:py-5">
              <span className="mono hidden w-5 shrink-0 pt-1 text-[0.625rem] text-ink-3 sm:block">
                {String(index + 1).padStart(2, '0')}
              </span>

              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
                className="flex-1 text-left"
              >
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="label text-ink">{methodName(item.analysisType)}</span>
                  <time className="label" dateTime={date.toISOString()}>
                    {shortDate.format(date)}
                  </time>
                </span>
                <span
                  className={`mt-1.5 block max-w-[78ch] text-[1rem] leading-snug text-ink ${
                    open ? '' : 'line-clamp-2'
                  }`}
                >
                  {item.decision}
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-3 pt-0.5">
                <span
                  className="num w-9 text-right text-[0.75rem] text-ink-2"
                  title={`Inclinación ${tilt} de 100`}
                >
                  {tilt > 0 ? `+${tilt}` : tilt}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(item, index)}
                  className="flex h-8 w-8 items-center justify-center rounded-[2px] text-ink-2 opacity-100 transition-opacity duration-150 hover:bg-paper-3 hover:text-signal sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  aria-label={`Eliminar la lectura «${item.decision}»`}
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-[2px] text-ink-2 transition-colors duration-150 hover:bg-paper-3 hover:text-ink"
                  aria-label={open ? 'Cerrar la lectura' : 'Abrir la lectura'}
                  aria-expanded={open}
                >
                  {open ? (
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {open && (
              <div className="pb-10 sm:pl-10">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
                  <p className="label">{longDate.format(date)}</p>
                  <CopyButton textToCopy={formatResultForClipboard(item.decision, item.result)} />
                </div>
                <AnalysisView result={item.result} dense />
              </div>
            )}
          </article>
        );
      })}

      {lastDeleted && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 border border-ink bg-paper-2 px-4 py-2.5 shadow-none"
        >
          <p className="max-w-[38ch] truncate text-[0.8125rem] text-ink-2">
            Lectura eliminada: <span className="text-ink">{lastDeleted.item.decision}</span>
          </p>
          <button
            type="button"
            onClick={handleUndo}
            className="flex shrink-0 items-center gap-1.5 border-b border-ink-3 pb-0.5 text-[0.75rem] text-ink transition-colors duration-150 hover:border-signal hover:text-signal"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            Deshacer
          </button>
        </div>
      )}
    </div>
  );
}
