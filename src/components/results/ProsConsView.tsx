import { CheckCircle2, XCircle } from 'lucide-react';
import type { ProsConsResult } from '../../types/analysis';

export function ProsConsView({ result }: { result: ProsConsResult }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6" />
          Pros
        </h3>
        <ul className="space-y-4">
          {result.pros.map((pro, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2.5 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{pro}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-xl font-bold text-rose-700 dark:text-rose-400 mb-6 flex items-center gap-2">
          <XCircle className="w-6 h-6" />
          Cons
        </h3>
        <ul className="space-y-4">
          {result.cons.map((con, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2.5 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{con}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
