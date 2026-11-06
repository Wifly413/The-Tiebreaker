import type { CSSProperties } from 'react';

export interface BeamProps {
  /** -100 … +100. Positivo = el platillo izquierdo baja. */
  tilt: number;
  leftLabel?: string;
  rightLabel?: string;
  size?: 'sm' | 'md';
  showReadout?: boolean;
}

/** La aguja se asienta una sola vez. Solo `transform`, mismo ease que el resto del producto. */
const TRANSITION = 'transform 560ms cubic-bezier(0.16, 1, 0.3, 1)';

interface Geometry {
  width: number;
  height: number;
  pivotX: number;
  pivotY: number;
  halfBeam: number;
  /** Grados de inclinación en los extremos (-100 … +100). */
  maxAngle: number;
  chain: number;
  panHalf: number;
  panSag: number;
  standSpread: number;
  baseOverhang: number;
  groundY: number;
  railInset: number;
  tick: number;
  pivotRadius: number;
  pivotDot: number;
  beamWidth: number;
}

const GEOMETRY: Record<'sm' | 'md', Geometry> = {
  sm: {
    width: 96,
    height: 58,
    pivotX: 48,
    pivotY: 16,
    halfBeam: 32,
    maxAngle: 14,
    chain: 8,
    panHalf: 8,
    panSag: 3.5,
    standSpread: 9,
    baseOverhang: 7,
    groundY: 50,
    railInset: 3,
    tick: 3,
    pivotRadius: 2.4,
    pivotDot: 1.1,
    beamWidth: 1,
  },
  md: {
    width: 420,
    height: 150,
    pivotX: 210,
    pivotY: 42,
    halfBeam: 150,
    maxAngle: 14,
    chain: 28,
    panHalf: 16,
    panSag: 8,
    standSpread: 28,
    baseOverhang: 24,
    groundY: 132,
    railInset: 22,
    tick: 5,
    pivotRadius: 4,
    pivotDot: 1.8,
    beamWidth: 1.25,
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function signedNumber(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `\u2212${Math.abs(value)}`;
  return '0';
}

export function Beam({
  tilt,
  leftLabel = 'A favor',
  rightLabel = 'En contra',
  size = 'md',
  showReadout = true,
}: BeamProps) {
  const g = GEOMETRY[size];
  const value = Number.isFinite(tilt) ? Math.round(clamp(tilt, -100, 100)) : 0;
  const magnitude = Math.abs(value);
  const reading = value > 0 ? 'a favor' : value < 0 ? 'en contra' : 'en equilibrio';

  /** Grados reales de la viga. Positivo = el extremo izquierdo baja. */
  const angle = (value / 100) * g.maxAngle;
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const leftTip = {
    x: g.pivotX - g.halfBeam * cos,
    y: g.pivotY + g.halfBeam * sin,
  };
  const rightTip = {
    x: g.pivotX + g.halfBeam * cos,
    y: g.pivotY - g.halfBeam * sin,
  };

  const beamTransform: CSSProperties = {
    transformOrigin: '0 0',
    transform: `translate(${g.pivotX}px, ${g.pivotY}px) rotate(${-angle}deg) translate(${-g.pivotX}px, ${-g.pivotY}px)`,
    transition: TRANSITION,
  };

  const pans = [leftTip, rightTip].map((tip, index) => (
    <g
      key={index}
      style={{ transform: `translate(${tip.x}px, ${tip.y}px)`, transition: TRANSITION }}
    >
      <g className="stroke-rule-strong" fill="none" strokeWidth={1}>
        <line x1={0} y1={0} x2={-g.panHalf + 3} y2={g.chain} vectorEffect="non-scaling-stroke" />
        <line x1={0} y1={0} x2={g.panHalf - 3} y2={g.chain} vectorEffect="non-scaling-stroke" />
        <line x1={0} y1={0} x2={0} y2={g.chain} vectorEffect="non-scaling-stroke" />
      </g>
      <g className="stroke-ink" fill="none" strokeWidth={size === 'md' ? 1.25 : 1}>
        <path
          d={`M ${-g.panHalf} ${g.chain} Q 0 ${g.chain + g.panSag} ${g.panHalf} ${g.chain}`}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={-g.panHalf}
          y1={g.chain - g.tick * 0.6}
          x2={-g.panHalf}
          y2={g.chain}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={g.panHalf}
          y1={g.chain - g.tick * 0.6}
          x2={g.panHalf}
          y2={g.chain}
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </g>
  ));

  return (
    <div className={size === 'md' ? 'w-full max-w-[420px]' : 'w-24'}>
      <svg
        viewBox={`0 0 ${g.width} ${g.height}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`Inclinación ${magnitude} de 100 ${reading}`}
        focusable="false"
      >
        {/* Rail de referencia: la posición de reposo de la viga. */}
        <line
          x1={g.railInset}
          y1={g.pivotY}
          x2={g.width - g.railInset}
          y2={g.pivotY}
          className="stroke-rule"
          strokeWidth={1}
          strokeDasharray="1 5"
          vectorEffect="non-scaling-stroke"
        />

        {/* Marcas de calibración en los extremos del reposo. */}
        <line
          x1={g.pivotX - g.halfBeam}
          y1={g.pivotY - g.tick}
          x2={g.pivotX - g.halfBeam}
          y2={g.pivotY + g.tick}
          className="stroke-rule-strong"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={g.pivotX + g.halfBeam}
          y1={g.pivotY - g.tick}
          x2={g.pivotX + g.halfBeam}
          y2={g.pivotY + g.tick}
          className="stroke-rule-strong"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />

        {/* Soporte del instrumento. */}
        <g className="stroke-ink" fill="none" strokeWidth={1}>
          <path
            d={`M ${g.pivotX} ${g.pivotY + 3} L ${g.pivotX - g.standSpread} ${g.groundY}`}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${g.pivotX} ${g.pivotY + 3} L ${g.pivotX + g.standSpread} ${g.groundY}`}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={g.pivotX - g.standSpread - g.baseOverhang}
            y1={g.groundY}
            x2={g.pivotX + g.standSpread + g.baseOverhang}
            y2={g.groundY}
            vectorEffect="non-scaling-stroke"
          />
        </g>

        {/* Viga: lo único que se mueve. */}
        <g style={beamTransform} className="stroke-ink" fill="none" strokeWidth={g.beamWidth}>
          <line
            x1={g.pivotX - g.halfBeam}
            y1={g.pivotY}
            x2={g.pivotX + g.halfBeam}
            y2={g.pivotY}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={g.pivotX - g.halfBeam}
            y1={g.pivotY - g.tick * 0.8}
            x2={g.pivotX - g.halfBeam}
            y2={g.pivotY + g.tick * 0.8}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={g.pivotX + g.halfBeam}
            y1={g.pivotY - g.tick * 0.8}
            x2={g.pivotX + g.halfBeam}
            y2={g.pivotY + g.tick * 0.8}
            vectorEffect="non-scaling-stroke"
          />
        </g>

        {/* Pivote: la marca de calibración en lápiz rojo. */}
        <circle
          cx={g.pivotX}
          cy={g.pivotY}
          r={g.pivotRadius}
          className="fill-paper stroke-ink"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={g.pivotX} cy={g.pivotY} r={g.pivotDot} className="fill-signal" />

        {/* Platillos: cuelgan de los extremos y se mantienen nivelados. */}
        {pans}
      </svg>

      {size === 'md' ? (
        <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-baseline gap-3 border-t border-rule pt-2">
          <span className="label">{leftLabel}</span>
          {showReadout ? (
            <span className="flex items-baseline gap-1 leading-none">
              <span className="num text-[1.5rem] text-ink">{signedNumber(value)}</span>
              <span className="label">/100</span>
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
          <span className="label text-right">{rightLabel}</span>
        </div>
      ) : null}

      {size === 'sm' && showReadout ? (
        <p className="mt-0.5 text-center leading-none">
          <span className="num text-[0.6875rem] text-ink-2">{signedNumber(value)}</span>
        </p>
      ) : null}
    </div>
  );
}
