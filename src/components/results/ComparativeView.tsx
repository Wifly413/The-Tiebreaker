import type { ComparativeResult } from '../../types/analysis';

export function ComparativeView({ result }: { result: ComparativeResult }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs w-1/4">
                Criteria
              </th>
              {result.options.map((opt, i) => (
                <th key={i} className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100 text-lg">
                  {opt.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {result.criteria.map((criterion, cIdx) => (
              <tr key={cIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="p-4 sm:p-6 font-medium text-slate-700 dark:text-slate-300 align-top">
                  {criterion}
                </td>
                {result.options.map((opt, oIdx) => (
                  <td key={oIdx} className="p-4 sm:p-6 text-slate-600 dark:text-slate-400 align-top leading-relaxed">
                    {opt.evaluations[cIdx]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
