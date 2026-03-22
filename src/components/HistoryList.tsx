import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, Table2, Target, Trash2, ChevronDown, ChevronUp, Calendar, BrainCircuit, History } from 'lucide-react';
import type { HistoryItem, AnalysisType } from '../types/analysis';
import { ProsConsView } from './results/ProsConsView';
import { ComparativeView } from './results/ComparativeView';
import { SwotView } from './results/SwotView';
import { CopyButton } from './CopyButton';
import { formatResultForClipboard } from '../utils/formatClipboard';

interface HistoryListProps {
  history: HistoryItem[];
  onDelete: (id: string) => void;
  onStartNew: () => void;
}

export function HistoryList({ history, onDelete, onStartNew }: HistoryListProps) {
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
    if (expandedHistoryId === id) {
      setExpandedHistoryId(null);
    }
  };

  const getAnalysisTypeLabel = (type: AnalysisType) => {
    switch (type) {
      case 'pros-cons': return 'Pros & Cons';
      case 'comparative': return 'Comparative';
      case 'swot': return 'SWOT Analysis';
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <History className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No history yet</h3>
        <p className="text-slate-500 dark:text-slate-400">Your analyzed decisions will appear here.</p>
        <button 
          onClick={onStartNew}
          className="mt-6 text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          Start a new analysis &rarr;
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => {
        const isExpanded = expandedHistoryId === item.id;
        return (
          <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all">
            <div 
              className="p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start justify-between gap-4"
              onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                    {item.analysisType === 'pros-cons' && <Scale className="w-3.5 h-3.5" />}
                    {item.analysisType === 'comparative' && <Table2 className="w-3.5 h-3.5" />}
                    {item.analysisType === 'swot' && <Target className="w-3.5 h-3.5" />}
                    {getAnalysisTypeLabel(item.analysisType)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className={`text-lg font-medium text-slate-900 dark:text-slate-100 ${!isExpanded && 'line-clamp-2'}`}>
                  {item.decision}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="p-2 text-slate-400 dark:text-slate-500">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                >
                  <div className="p-6 space-y-6">
                    <div className="flex justify-end mb-[-1.5rem] relative z-10">
                      <CopyButton textToCopy={formatResultForClipboard(item.decision, item.result)} />
                    </div>
                    {item.result.type === 'pros-cons' && <ProsConsView result={item.result} />}
                    {item.result.type === 'comparative' && <ComparativeView result={item.result} />}
                    {item.result.type === 'swot' && <SwotView result={item.result} />}
                    
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/50">
                      <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5" />
                        AI Conclusion
                      </h3>
                      <p className="text-indigo-900 dark:text-indigo-200 leading-relaxed">
                        {item.result.conclusion}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
