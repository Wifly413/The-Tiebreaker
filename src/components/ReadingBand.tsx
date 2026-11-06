import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { AnalysisResult } from '../types/analysis';
import { METHOD_BY_ID, READ_LABELS } from '../constants/methods';
import { Beam } from './Beam';

export interface ReadingBandProps {
  result: AnalysisResult;
  /** Versión compacta para una fila plegada del archivo. */
  dense?: boolean;
}

const REVEAL_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function ReadingBand({ result, dense = false }: ReadingBandProps) {
  const reduced = usePrefersReducedMotion();
  const animate = !reduced && !dense;

  const tilt = Number.isFinite(result.tilt) ? result.tilt : 0;
  const confidence = Math.round(clamp(Number.isFinite(result.confidence) ? result.confidence : 0, 0, 100));
  const filled = Math.round(confidence / 10);
  const method = METHOD_BY_ID[result.type];

  const [armed, setArmed] = useState(!animate);
  const [landed, setLanded] = useState(!animate);

  useEffect(() => {
    if (!animate) {
      setArmed(true);
      setLanded(true);
      return;
    }
    const start = window.setTimeout(() => setArmed(true), 40);
    const land = window.setTimeout(() => setLanded(true), 590);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(land);
    };
  }, [animate, tilt]);

  const verdictReveal: CSSProperties | undefined = animate
    ? { opacity: armed ? 1 : 0, transition: `opacity 280ms ${REVEAL_EASING} 40ms` }
    : undefined;

  const reading = tilt > 0 ? 'a favor' : tilt < 0 ? 'en contra' : 'empate';

  return (
    <section aria-label={`Lectura: ${method?.name ?? 'análisis'}`}>
      <div className="grid grid-cols-1 gap-x-12 gap-y-7 lg:grid-cols-12 lg:gap-y-6">
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule pb-2">
            <p className="label">{method?.name ?? result.type}</p>
            <p className="label">{reading}</p>
          </div>

          <h2
            className={
              dense
                ? 'mt-3 max-w-[64ch] text-[1.125rem] font-semibold leading-[1.35] tracking-[-0.01em] text-ink'
                : 'display mt-4 max-w-[56ch] text-ink'
            }
            style={
              dense
                ? undefined
                : {
                    fontSize: 'clamp(1.5rem, 1rem + 1.5vw, 2.125rem)',
                    letterSpacing: '-0.03em',
                    ...verdictReveal,
                  }
            }
          >
            {result.verdict}
          </h2>
        </div>

        <div className="lg:col-span-5 lg:row-span-2">
          <Beam
            tilt={armed ? tilt : 0}
            leftLabel={READ_LABELS.tiltPositive}
            rightLabel={READ_LABELS.tiltNegative}
            size="md"
            showReadout={landed}
          />

          <div className="mt-5 border-t border-rule pt-3">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="label">{READ_LABELS.confidence}</h3>
              <p className="num text-[0.9375rem] leading-none text-ink">
                {confidence}
                <span className="label ml-1">/ 100</span>
              </p>
            </div>
            <div className="mt-2 flex h-[7px] gap-[2px]" aria-hidden="true">
              {Array.from({ length: 10 }, (_, index) => (
                <span
                  key={index}
                  className={`h-full flex-1 ${index < filled ? 'bg-ink' : 'bg-rule'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-rule pt-3 lg:col-span-7">
          <h3 className="label text-signal">{READ_LABELS.decisive}</h3>
          <p className="mt-2 max-w-[62ch] border-l-2 border-signal pl-3 text-[1.0625rem] leading-[1.6] text-ink">
            {result.decisiveFactor}
          </p>
        </div>
      </div>
    </section>
  );
}
