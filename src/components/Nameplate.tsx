import { Moon, Sun } from 'lucide-react';

export function BeamMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 30" className={className} fill="none" aria-hidden="true">
      <path d="M4 9 L40 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M22 7.6 V21.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 9 V14.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M40 6 V11.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M0.5 14.5 H11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M32.5 11.5 H43.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M22 29 L18 21.5 H26 Z" fill="currentColor" />
    </svg>
  );
}

export type AppView = 'nuevo' | 'archivo';

interface NameplateProps {
  view: AppView;
  onViewChange: (view: AppView) => void;
  historyCount: number;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Nameplate({ view, onViewChange, historyCount, isDark, onToggleTheme }: NameplateProps) {
  const tab = (id: AppView, label: string, count?: number) => {
    const active = view === id;
    return (
      <button
        type="button"
        onClick={() => onViewChange(id)}
        aria-current={active ? 'page' : undefined}
        className={`mono whitespace-nowrap border-b pb-1 text-[0.75rem] transition-colors duration-150 ${
          active
            ? 'border-ink text-ink'
            : 'border-transparent text-ink-2 hover:border-rule-strong hover:text-ink'
        }`}
      >
        {label}
        {typeof count === 'number' && count > 0 ? ` (${count})` : ''}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3 sm:h-16 sm:flex-nowrap sm:py-0 sm:px-8">
        <a
          href="#contenido"
          className="flex shrink-0 items-center gap-2.5 text-ink no-underline"
          aria-label="The Tiebreaker, ir al contenido"
        >
          <BeamMark className="h-6 w-auto text-signal" />
          <span className="text-[1.0625rem] font-semibold tracking-[-0.03em]" style={{ fontStretch: '86%' }}>
            The Tiebreaker
          </span>
          <span className="label ml-1 hidden md:inline">lectura de decisiones</span>
        </a>

        <div className="order-3 flex w-full items-center justify-between gap-6 border-t border-rule pt-2 sm:order-none sm:w-auto sm:justify-end sm:border-0 sm:pt-0">
          <nav aria-label="Secciones" className="flex items-center gap-5">
            {tab('nuevo', 'Nuevo caso')}
            {tab('archivo', 'Archivo', historyCount)}
          </nav>

          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-rule text-ink-2 transition-colors duration-150 hover:border-ink-3 hover:text-ink"
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
