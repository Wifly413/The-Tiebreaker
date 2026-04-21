import { useState, useEffect } from 'react';
import type { HistoryItem } from '../types/analysis';

export const MAX_ENTRIES = 50;

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('tiebreaker-history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('tiebreaker-history', JSON.stringify(history));
  }, [history]);

  const addItem = (item: HistoryItem) => {
    setHistory((prev) => {
      const newHistory = [item, ...prev];
      if (newHistory.length > MAX_ENTRIES) {
        return newHistory.slice(0, MAX_ENTRIES);
      }
      return newHistory;
    });
  };

  const deleteItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    setHistory([]);
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiebreaker-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    history,
    addItem,
    deleteItem,
    clearAll,
    exportHistory
  };
}
