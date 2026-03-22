import { TrendingUp, AlertTriangle, Sparkles, Target } from 'lucide-react';
import type { SwotResult } from '../../types/analysis';

export function SwotView({ result }: { result: SwotResult }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Strengths
        </h3>
        <ul className="space-y-4">
          {result.strengths.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2.5 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-xl font-bold text-rose-700 dark:text-rose-400 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Weaknesses
        </h3>
        <ul className="space-y-4">
          {result.weaknesses.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2.5 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          Opportunities
        </h3>
        <ul className="space-y-4">
          {result.opportunities.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-xl font-bold text-amber-700 dark:text-amber-400 mb-6 flex items-center gap-2">
          <Target className="w-6 h-6" />
          Threats
        </h3>
        <ul className="space-y-4">
          {result.threats.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2.5 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
