import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'theme';

type ThemePreference = 'dark' | 'light';

function readStoredPreference(): ThemePreference | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === 'dark' || stored === 'light' ? stored : null;
  } catch {
    // Almacenamiento bloqueado (modo privado, permisos): se usa el sistema.
    return null;
  }
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Tema claro/oscuro.
 *
 * - Si el usuario ya eligió tema (`theme` en localStorage), manda su elección.
 * - Si no hay preferencia guardada, se sigue al sistema y se reacciona en vivo a
 *   `prefers-color-scheme` (el listener solo se registra en el cliente).
 * - La elección se persiste únicamente al alternar; navegar nunca congela el
 *   tema del sistema sin que el usuario lo haya pedido.
 */
export function useDarkMode(): { isDark: boolean; toggle: () => void } {
  const [preference, setPreference] = useState<ThemePreference | null>(readStoredPreference);
  const [systemIsDark, setSystemIsDark] = useState<boolean>(systemPrefersDark);

  const isDark = preference === null ? systemIsDark : preference === 'dark';

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemIsDark(event.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    if (preference === null) return;
    try {
      window.localStorage.setItem(THEME_KEY, preference);
    } catch {
      // Sin persistencia: el tema sigue funcionando mientras dure la sesión.
    }
  }, [isDark, preference]);

  const toggle = useCallback(() => {
    setPreference(isDark ? 'light' : 'dark');
  }, [isDark]);

  return { isDark, toggle };
}
