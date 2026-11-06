import type { MethodSpec } from '../constants/methods';

/** Esquemas del instrumento: balanza, matriz y cuadrantes. Nada de iconos genéricos. */
function InstrumentGlyph({ id, className = '' }: { id: MethodSpec['id']; className?: string }) {
  if (id === 'balance') {
    return (
      <svg viewBox="0 0 52 34" className={className} fill="none" aria-hidden="true">
        <path d="M5 10 L47 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M26 8.5 V24" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5 10 V16" stroke="currentColor" strokeWidth="1.2" />
        <path d="M47 7 V13" stroke="currentColor" strokeWidth="1.2" />
        <path d="M1 16 H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M40 13 H51" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M26 32 L21.5 24 H30.5 Z" fill="currentColor" />
      </svg>
    );
  }

  if (id === 'head-to-head') {
    const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    return (
      <svg viewBox="0 0 52 34" className={className} fill="none" aria-hidden="true">
        {cells.map((i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const filled = i === 2 || i === 4 || i === 6 || i === 7;
          return (
            <rect
              key={i}
              x={4 + col * 15}
              y={5 + row * 9}
              width="12"
              height="7"
              stroke="currentColor"
              strokeWidth="1.1"
              fill={filled ? 'currentColor' : 'none'}
              opacity={filled ? 0.9 : 0.45}
            />
          );
        })}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 52 34" className={className} fill="none" aria-hidden="true">
      <rect x="4" y="4" width="20" height="12" stroke="currentColor" strokeWidth="1.1" fill="currentColor" />
      <rect x="28" y="4" width="20" height="12" stroke="currentColor" strokeWidth="1.1" fill="currentColor" opacity="0.35" />
      <rect x="4" y="20" width="20" height="12" stroke="currentColor" strokeWidth="1.1" fill="currentColor" opacity="0.35" />
      <rect x="28" y="20" width="20" height="12" stroke="currentColor" strokeWidth="1.1" fill="none" />
      <path d="M26 4 V32" stroke="currentColor" strokeWidth="1.1" />
      <path d="M4 18 H48" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

interface ModePlateProps {
  method: MethodSpec;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
}

export function ModePlate({ method, index, total, selected, onSelect }: ModePlateProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group grid h-full grid-cols-[46px_1fr] items-start gap-x-4 p-4 text-left transition-colors duration-150 sm:flex sm:flex-col sm:justify-between sm:p-5 ${
        selected ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-paper-3'
      }`}
    >
      <span className="flex flex-col items-start gap-2 sm:w-full sm:flex-row sm:items-start sm:justify-between">
        <InstrumentGlyph
          id={method.id}
          className={`h-7 w-auto sm:h-8 ${selected ? 'text-paper' : 'text-ink-2 group-hover:text-ink'}`}
        />
        <span className={`mono text-[0.625rem] ${selected ? 'text-paper/70' : 'text-ink-2'}`}>
          {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
        </span>
      </span>

      <span className="block sm:mt-8">
        <span
          className={`block text-[0.9375rem] font-semibold leading-tight tracking-[-0.01em] ${
            selected ? 'text-paper' : 'text-ink'
          }`}
        >
          {method.name}
        </span>
        <span
          className={`mt-1.5 block text-[0.75rem] leading-[1.45] sm:mt-2 ${
            selected ? 'text-paper/75' : 'text-ink-2'
          }`}
        >
          {method.measures}
        </span>
      </span>
    </button>
  );
}
