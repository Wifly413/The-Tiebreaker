import React from 'react';

interface MethodCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export function MethodCard({ icon, title, description, selected, onClick }: MethodCardProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-2xl border transition-all ${
        selected 
          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 ring-1 ring-indigo-200 dark:ring-indigo-700' 
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <div className={`mb-2 ${selected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
        {icon}
      </div>
      <h3 className={`font-semibold mb-1 ${selected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-slate-200'}`}>
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </button>
  );
}
