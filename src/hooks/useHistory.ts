import { useState, useEffect } from 'react';
import type { HistoryItem } from '../types/analysis';

export const MAX_ENTRIES = 50;
const STORAGE_KEY = 'tiebreaker_history';

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return []; // dato corrupto: empezar limpio
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        // Eliminar el item mas antiguo y reintentar automaticamente
        setHistory(prev => prev.slice(0, -1));
      }
    }
  }, [history]);

  const addItem = (item: HistoryItem) => {
    setHistory(prev => [item, ...prev].slice(0, MAX_ENTRIES));
  };

  const deleteItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearAll = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todo el historial?')) {
      setHistory([]);
    }
  };

  const exportHistory = () => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `tiebreaker-historial-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return { history, addItem, deleteItem, clearAll, exportHistory };
}
