import { useEffect, useState } from 'react';
import { fetchServiceStatus } from '../api';

export type ServiceState = 'checking' | 'ready' | 'demo' | 'offline';

/**
 * Pregunta al servidor si tiene clave del proveedor. Es lo que decide si la
 * acción principal es «Desempatar» o «Ver un caso de ejemplo».
 */
export function useServiceStatus(): { state: ServiceState; model: string | null } {
  const [state, setState] = useState<ServiceState>('checking');
  const [model, setModel] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetchServiceStatus(controller.signal)
      .then((status) => {
        if (!active) return;
        if (!status) {
          setState('offline');
          return;
        }
        setModel(status.model || null);
        setState(status.ready ? 'ready' : 'demo');
      })
      .catch(() => {
        if (active) setState('offline');
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return { state, model };
}
