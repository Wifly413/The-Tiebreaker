import { useEffect, useRef, useState } from 'react';
import type { AnalysisType } from './types/analysis';
import { METHODS } from './constants/methods';
import { DEMO_CASES } from './data/demoCases';
import { useHistory } from './hooks/useHistory';
import { useAnalysis } from './hooks/useAnalysis';
import { useDarkMode } from './hooks/useDarkMode';
import { useServiceStatus } from './hooks/useServiceStatus';
import { Nameplate, type AppView } from './components/Nameplate';
import { DossierForm } from './components/DossierForm';
import { ReadoutRail } from './components/ReadoutRail';
import { ArchiveList } from './components/ArchiveList';
import { AnalysisView } from './components/AnalysisView';
import { CaseStrip } from './components/CaseStrip';
import { CopyButton } from './components/CopyButton';
import { formatResultForClipboard } from './utils/formatClipboard';

const LOADING_MESSAGES = ['Leyendo el caso', 'Pesando los factores', 'Redactando el veredicto'];
const resultDate = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function App() {
  const [view, setView] = useState<AppView>('nuevo');
  const { history, addItem, deleteItem, restoreItem, clearAll, exportHistory } = useHistory();
  const { analyze, loadDemo, reset, loading, error, result } = useAnalysis();
  const { isDark, toggle } = useDarkMode();
  const service = useServiceStatus();

  const [decision, setDecision] = useState('');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('balance');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showLens, setShowLens] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [editingCase, setEditingCase] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [resultStamp, setResultStamp] = useState<number | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);
  const shouldScroll = useRef(false);

  const selectedMethod = METHODS.find((method) => method.id === analysisType) ?? METHODS[0];

  useEffect(() => {
    if (!loading) {
      setMessageIndex(0);
      return;
    }
    const id = window.setInterval(
      () => setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length),
      2600
    );
    return () => window.clearInterval(id);
  }, [loading]);

  const scrollToReading = () => {
    const node = resultRef.current;
    if (!node) return;
    window.scrollTo({
      top: Math.max(node.offsetTop - 88, 0),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  useEffect(() => {
    if (!result || !shouldScroll.current) return;
    shouldScroll.current = false;
    scrollToReading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  useEffect(() => {
    if (!showConfirmClear) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowConfirmClear(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [showConfirmClear]);

  const handleSubmit = async () => {
    shouldScroll.current = true;
    const finalResult = await analyze(decision, analysisType, customInstructions);
    if (!finalResult) {
      shouldScroll.current = false;
      return;
    }
    setResultStamp(Date.now());
    setEditingCase(false);
    addItem({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      decision: decision.trim(),
      analysisType,
      customInstructions: customInstructions.trim(),
      result: finalResult,
    });
  };

  const handleLoadDemo = () => {
    const demo = DEMO_CASES[analysisType];
    if (!demo) return;
    setDecision(demo.decision);
    setResultStamp(Date.now());
    setEditingCase(false);
    shouldScroll.current = true;
    loadDemo(demo.result);
  };

  const handleAnalysisTypeChange = (next: AnalysisType) => {
    if (next === analysisType) return;
    setAnalysisType(next);
    reset();
    setResultStamp(null);
    setEditingCase(false);
  };

  const showCaseStrip = Boolean(result) && !editingCase && view === 'nuevo';

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <div className="grain" aria-hidden="true" />
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>

      <Nameplate
        view={view}
        onViewChange={setView}
        historyCount={history.length}
        isDark={isDark}
        onToggleTheme={toggle}
      />

      <main id="contenido" className="mx-auto w-full max-w-[1240px] flex-1 px-5 pb-20 sm:px-8">
        <p className="sr-only" role="status">
          {loading ? `${LOADING_MESSAGES[messageIndex]}…` : result ? 'Lectura lista.' : ''}
        </p>

        {view === 'nuevo' ? (
          <>
            {showCaseStrip && result ? (
              <div className="pt-6">
                <CaseStrip
                  decision={decision}
                  method={selectedMethod}
                  timestamp={resultStamp}
                  onEdit={() => {
                    setEditingCase(true);
                    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
                  }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 py-10 lg:grid-cols-12 lg:gap-0 lg:py-14">
              <div className="lg:col-span-7 lg:pr-12">
                <DossierForm
                  decision={decision}
                  onDecisionChange={setDecision}
                  analysisType={analysisType}
                  onAnalysisTypeChange={handleAnalysisTypeChange}
                  customInstructions={customInstructions}
                  onCustomInstructionsChange={setCustomInstructions}
                  showLens={showLens}
                  onToggleLens={() => setShowLens((value) => !value)}
                  onSubmit={handleSubmit}
                  onLoadDemo={handleLoadDemo}
                  loading={loading}
                  error={error}
                  loadingMessage={`${LOADING_MESSAGES[messageIndex]}…`}
                  serviceState={service.state}
                  serviceModel={service.model}
                />
              </div>
              <div className="hidden lg:col-span-5 lg:block lg:border-l lg:border-rule lg:pl-12">
                <ReadoutRail
                  method={selectedMethod}
                  latest={result}
                  onJumpToResult={scrollToReading}
                />
              </div>
            </div>
            )}

            {editingCase && result && (
              <div className="flex justify-end border-b border-rule pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCase(false);
                    scrollToReading();
                  }}
                  className="mono border-b border-ink-3 pb-0.5 text-[0.75rem] text-ink transition-colors duration-150 hover:border-signal hover:text-signal"
                >
                  Volver a la lectura
                </button>
              </div>
            )}

            <section ref={resultRef} aria-labelledby="lectura-titulo" className="scroll-mt-24">
              {result && (
                <div className="border-t-2 border-ink pt-6 sm:pt-8">
                  <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-baseline gap-3">
                      <h2 id="lectura-titulo" className="label text-ink">
                        Lectura
                      </h2>
                      <span className="label">
                        {resultStamp ? resultDate.format(new Date(resultStamp)) : ''}
                      </span>
                    </div>
                    <CopyButton textToCopy={formatResultForClipboard(decision, result)} />
                  </div>
                  <AnalysisView result={result} />
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="py-10 lg:py-14">
            <div className="flex flex-col gap-5 border-b border-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="display text-[clamp(1.875rem,3.2vw,2.75rem)]">Archivo</h1>
                <p className="label mt-2">
                  {history.length} de 50 lecturas guardadas en este navegador
                </p>
              </div>
              {history.length > 0 && (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={exportHistory} className="btn btn-quiet">
                    <span className="mono text-[0.6875rem]">Exportar JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(true)}
                    className="btn btn-quiet-danger"
                  >
                    <span className="mono text-[0.6875rem]">Vaciar archivo</span>
                  </button>
                </div>
              )}
            </div>
            <ArchiveList
              history={history}
              onDelete={deleteItem}
              onRestore={restoreItem}
              onStartNew={() => setView('nuevo')}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:px-8">
          <span className="label">The Tiebreaker — lectura de decisiones</span>
          <span className="label">
            Tres métodos: balanza ponderada, cara a cara, mapa estratégico.
          </span>
        </div>
      </footer>

      {showConfirmClear && (
        <div
          className="dialog-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
          onClick={() => setShowConfirmClear(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vaciar-titulo"
            aria-describedby="vaciar-detalle"
            className="dialog-panel w-full max-w-md border border-ink bg-paper-2 p-6 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="label">Confirmación</p>
            <h2 id="vaciar-titulo" className="mt-2 text-[1.375rem] font-semibold leading-tight">
              ¿Vaciar el archivo?
            </h2>
            <p id="vaciar-detalle" className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-2">
              Se eliminarán las {history.length} lecturas guardadas en este navegador. No se puede
              deshacer.
            </p>
            <div className="mt-8 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="btn btn-quiet"
                autoFocus
              >
                <span className="mono text-[0.6875rem]">Cancelar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setShowConfirmClear(false);
                }}
                className="btn btn-danger"
              >
                <span className="mono text-[0.6875rem]">Vaciar el archivo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
