import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, Table2, Target, Sparkles, AlertTriangle, Loader2, BrainCircuit, Settings2, History, Plus, Moon, Sun } from 'lucide-react';

import type { AnalysisType } from './types/analysis';
import { useHistory, MAX_ENTRIES } from './hooks/useHistory';
import { useAnalysis } from './hooks/useAnalysis';
import { useDarkMode } from './hooks/useDarkMode';

import { MethodCard } from './components/MethodCard';
import { HistoryList } from './components/HistoryList';
import { ProsConsView } from './components/results/ProsConsView';
import { ComparativeView } from './components/results/ComparativeView';
import { SwotView } from './components/results/SwotView';
import { CopyButton } from './components/CopyButton';
import { formatResultForClipboard } from './utils/formatClipboard';

const MAX_CHARS = 2000;

export default function App() {
  const [view, setView] = useState<'new' | 'history'>('new');
  const { history, addItem, deleteItem, clearAll, exportHistory } = useHistory();
  const { analyze, loading, error, result } = useAnalysis();
  const { isDark, toggle } = useDarkMode();

  const [decision, setDecision] = useState('');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('pros-cons');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const charCount = decision.length;
  const isOverLimit = charCount > MAX_CHARS;

  const handleBreakTie = async () => {
    const finalResult = await analyze(decision, analysisType, customInstructions);
    if (finalResult) {
      addItem({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        decision,
        analysisType,
        customInstructions,
        result: finalResult
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-indigo-200 dark:selection:bg-indigo-900 transition-colors duration-200">
      <button 
        onClick={toggle} 
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        aria-label="Toggle dark mode"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
        
        {/* Header */}
        <header className="text-center mb-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm mb-6 border border-slate-100 dark:border-slate-800"
          >
            <BrainCircuit className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4"
          >
            The Tiebreaker
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto"
          >
            Describe your dilemma and let AI help you weigh the options with clarity and precision.
          </motion.p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl inline-flex">
            <button
              onClick={() => setView('new')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
                view === 'new' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              New Analysis
            </button>
            <button
              onClick={() => setView('history')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
                view === 'history' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              History {history.length > 0 && <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 py-0.5 px-2 rounded-full text-xs">{history.length}</span>}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'new' && (
            <motion.div
              key="new"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Input Section */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 mb-8">
                <div className="mb-6">
                  <label htmlFor="decision" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                    What's on your mind?
                  </label>
                  <textarea
                    id="decision"
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    placeholder="e.g., Should I accept the new job offer in a different city or stay at my current comfortable job?"
                    className="w-full min-h-[120px] p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y text-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <div className="flex justify-between text-xs mt-1.5 px-1">
                    <span className="text-slate-400 dark:text-slate-500">
                      Se específico para obtener un mejor análisis
                    </span>
                    <span className={isOverLimit ? "text-red-500 font-semibold" : "text-slate-400 dark:text-slate-500"}>
                      {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                    Analysis Method
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <MethodCard 
                      icon={<Scale className="w-5 h-5" />}
                      title="Pros & Cons"
                      description="Simple list of advantages and disadvantages."
                      selected={analysisType === 'pros-cons'}
                      onClick={() => setAnalysisType('pros-cons')}
                    />
                    <MethodCard 
                      icon={<Table2 className="w-5 h-5" />}
                      title="Comparative"
                      description="Side-by-side evaluation of options."
                      selected={analysisType === 'comparative'}
                      onClick={() => setAnalysisType('comparative')}
                    />
                    <MethodCard 
                      icon={<Target className="w-5 h-5" />}
                      title="SWOT"
                      description="Strengths, Weaknesses, Opportunities, Threats."
                      selected={analysisType === 'swot'}
                      onClick={() => setAnalysisType('swot')}
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors uppercase tracking-wider mb-3"
                  >
                    <Settings2 className="w-4 h-4" />
                    Advanced Options {showAdvanced ? '(Hide)' : '(Show)'}
                  </button>
                  
                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl mt-1">
                          <label htmlFor="customInstructions" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Custom AI Instructions (Optional)
                          </label>
                          <textarea
                            id="customInstructions"
                            value={customInstructions}
                            onChange={(e) => setCustomInstructions(e.target.value)}
                            placeholder="e.g., Act as a cynical financial advisor, focus heavily on long-term ROI, use a formal tone..."
                            className="w-full min-h-[80px] p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleBreakTie}
                  disabled={!decision.trim() || loading || isOverLimit}
                  className="w-full py-4 px-6 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-500 text-white rounded-2xl font-medium text-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Break the Tie
                    </>
                  )}
                </button>
                
                {error && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-start gap-2 border border-red-100 dark:border-red-900/50">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </div>

              {/* Results Section */}
              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-end mb-[-1rem] relative z-10 pr-2">
                      <CopyButton textToCopy={formatResultForClipboard(decision, result)} />
                    </div>
                    {result.type === 'pros-cons' && <ProsConsView result={result} />}
                    {result.type === 'comparative' && <ComparativeView result={result} />}
                    {result.type === 'swot' && <SwotView result={result} />}
                    
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-6 sm:p-8 border border-indigo-100 dark:border-indigo-800/50">
                      <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5" />
                        AI Conclusion
                      </h3>
                      <p className="text-indigo-900 dark:text-indigo-200 text-lg leading-relaxed">
                        {result.conclusion}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {history.length > 0 && (
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {history.length} de {MAX_ENTRIES} análisis guardados
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={exportHistory}
                      className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      Exportar JSON
                    </button>
                    <button 
                      onClick={clearAll}
                      className="text-sm font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                    >
                      Limpiar todo
                    </button>
                  </div>
                </div>
              )}
              <HistoryList 
                history={history} 
                onDelete={deleteItem} 
                onStartNew={() => setView('new')} 
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
