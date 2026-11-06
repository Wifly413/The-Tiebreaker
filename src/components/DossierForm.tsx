import { useEffect, useRef } from 'react';
import { Loader2, Plus, Minus } from 'lucide-react';
import type { AnalysisType } from '../types/analysis';
import type { ServiceState } from '../hooks/useServiceStatus';
import { METHODS } from '../constants/methods';
import { ModePlate } from './ModePlate';

export const MAX_CHARS = 2000;

interface DossierFormProps {
  decision: string;
  onDecisionChange: (value: string) => void;
  analysisType: AnalysisType;
  onAnalysisTypeChange: (value: AnalysisType) => void;
  customInstructions: string;
  onCustomInstructionsChange: (value: string) => void;
  showLens: boolean;
  onToggleLens: () => void;
  onSubmit: () => void;
  onLoadDemo: () => void;
  loading: boolean;
  error: string;
  loadingMessage: string;
  serviceState: ServiceState;
  serviceModel: string | null;
}

export function DossierForm({
  decision,
  onDecisionChange,
  analysisType,
  onAnalysisTypeChange,
  customInstructions,
  onCustomInstructionsChange,
  showLens,
  onToggleLens,
  onSubmit,
  onLoadDemo,
  loading,
  error,
  loadingMessage,
  serviceState,
  serviceModel,
}: DossierFormProps) {
  const charCount = decision.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = decision.trim().length > 0 && !loading && !isOverLimit;
  const serviceReady = serviceState === 'ready';

  const serviceNote = serviceReady
    ? `La lectura la genera ${serviceModel ?? 'el modelo configurado'} y se guarda en este navegador.`
    : serviceState === 'checking'
      ? 'Comprobando el servicio de análisis…'
      : serviceState === 'offline'
        ? 'No se pudo contactar con el servicio de análisis. El caso de ejemplo trae una lectura completa.'
        : 'El servidor no tiene clave del proveedor. Esta versión no genera lecturas nuevas; el ejemplo trae una completa.';

  const decisionRef = useRef<HTMLTextAreaElement>(null);
  const lensRef = useRef<HTMLTextAreaElement>(null);

  // El alto se recalcula también cuando el texto cambia por código (caso de
  // ejemplo): `onInput` solo cubre lo que teclea la persona.
  useEffect(() => {
    const el = decisionRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 148)}px`;
  }, [decision]);

  useEffect(() => {
    const el = lensRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 72)}px`;
  }, [customInstructions, showLens]);

  return (
    <section aria-labelledby="pregunta" className="flex flex-col">
      <h1
        id="pregunta"
        className="display max-w-[16ch] text-[clamp(2.25rem,4.4vw,3.5rem)] text-ink"
      >
        ¿Qué estás a punto de decidir?
      </h1>

      <p className="mt-5 max-w-[52ch] text-[1rem] leading-[1.6] text-ink-2">
        Escribe el dilema con las opciones que barajas y lo que está en juego: cifras, plazos,
        personas que se ven afectadas. Cuanto más concreto sea el caso, más útil sale la lectura.
      </p>

      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit();
        }}
      >
        <label htmlFor="decision" className="sr-only">
          El dilema
        </label>
        <textarea
          id="decision"
          ref={decisionRef}
          value={decision}
          onChange={(event) => onDecisionChange(event.target.value)}
          onInput={(event) => {
            const el = event.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${Math.max(el.scrollHeight, 148)}px`;
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              if (canSubmit) onSubmit();
            }
          }}
          placeholder="Ejemplo: me ofrecen un puesto en Ámsterdam con un 22 % más de sueldo, pero mi pareja acaba de empezar un trabajo en Valencia que no puede dejar."
          className="field min-h-[148px] overflow-hidden"
          aria-describedby="decision-ayuda"
          maxLength={MAX_CHARS + 200}
        />
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <span id="decision-ayuda" className="label">
            Opciones, cifras, plazos. Ctrl + Intro para enviar.
          </span>
          <span className={`label num shrink-0 whitespace-nowrap ${isOverLimit ? 'text-signal' : ''}`}>
            {charCount.toLocaleString('es-ES')} / {MAX_CHARS.toLocaleString('es-ES')}
          </span>
        </div>

        <div className="mt-10">
          <div className="flex items-baseline justify-between border-b border-rule pb-2">
            <h2 className="label">Método</h2>
            <span className="label">elige uno</span>
          </div>

          <div
            role="group"
            aria-label="Método de análisis"
            className="mt-px grid grid-cols-1 gap-px border-b border-rule bg-rule sm:grid-cols-3"
          >
            {METHODS.map((method, index) => (
              <ModePlate
                key={method.id}
                method={method}
                index={index}
                total={METHODS.length}
                selected={method.id === analysisType}
                onSelect={() => onAnalysisTypeChange(method.id)}
              />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onToggleLens}
            aria-expanded={showLens}
            aria-controls="lente"
            className="flex items-center gap-2 text-[0.75rem] text-ink-2 transition-colors duration-150 hover:text-ink"
          >
            <span className="mono">{showLens ? 'Quitar la lente' : 'Añadir una lente'}</span>
            {showLens ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </button>

          {showLens && (
            <div id="lente" className="mt-3">
              <label htmlFor="lente-texto" className="label">
                Lente (opcional)
              </label>
              <textarea
                id="lente-texto"
                ref={lensRef}
                value={customInstructions}
                onChange={(event) => onCustomInstructionsChange(event.target.value)}
                placeholder="Ejemplo: analiza como asesor financiero estricto y prioriza el coste real a tres años."
                className="field mt-2 min-h-[72px] overflow-hidden text-[0.9375rem]"
              />
              <p className="mt-1.5 label">
                Se añade a las reglas del método; no las sustituye.
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-rule pt-6 sm:flex-row sm:items-center sm:gap-5">
          {serviceReady ? (
            <button
              type="submit"
              className="btn btn-primary w-full shrink-0 whitespace-nowrap sm:w-auto"
              disabled={!canSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>{loadingMessage}</span>
                </>
              ) : (
                <span>Desempatar</span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onLoadDemo}
              className="btn btn-primary w-full shrink-0 whitespace-nowrap sm:w-auto"
            >
              <span>Ver un caso de ejemplo</span>
            </button>
          )}

          <p className="label max-w-[38ch] leading-[1.5]">{serviceNote}</p>
        </div>

        {serviceReady && (
          <button
            type="button"
            onClick={onLoadDemo}
            className="mono mt-3 border-b border-ink-3 pb-0.5 text-[0.75rem] text-ink transition-colors duration-150 hover:border-signal hover:text-signal"
          >
            Ver el caso de ejemplo
          </button>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 border border-signal/40 bg-signal-soft px-4 py-3 text-[0.875rem] leading-[1.5] text-ink"
          >
            <span className="mono mr-2 text-[0.6875rem] text-signal">Error</span>
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
