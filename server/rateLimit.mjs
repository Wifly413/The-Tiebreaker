/**
 * Límites en memoria: por IP en ventana deslizante y un tope diario global.
 * Suficiente para una instancia única en Render; si algún día hay varias, se
 * sustituye por Render Key Value sin tocar la API de este módulo.
 */

export function createLimiter({ windowMs, max, dailyLimit }) {
  /** @type {Map<string, { start: number, count: number }>} */
  const windows = new Map();
  let day = new Date().toISOString().slice(0, 10);
  let dayCount = 0;

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of windows) {
      if (now - entry.start > windowMs) windows.delete(key);
    }
  }, Math.max(windowMs, 60_000));
  cleanup.unref?.();

  return {
    /** @returns {{ ok: true } | { ok: false, status: number, retryAfter: number, message: string }} */
    take(ip) {
      const today = new Date().toISOString().slice(0, 10);
      if (today !== day) {
        day = today;
        dayCount = 0;
      }
      if (dayCount >= dailyLimit) {
        return {
          ok: false,
          status: 503,
          retryAfter: 3600,
          message:
            'Se ha alcanzado el límite diario de lecturas de esta demo. Vuelve mañana o usa el caso de ejemplo.',
        };
      }

      const now = Date.now();
      const entry = windows.get(ip);
      if (!entry || now - entry.start > windowMs) {
        windows.set(ip, { start: now, count: 1 });
        dayCount += 1;
        return { ok: true };
      }
      if (entry.count >= max) {
        return {
          ok: false,
          status: 429,
          retryAfter: Math.ceil((windowMs - (now - entry.start)) / 1000),
          message: 'Demasiadas lecturas seguidas desde esta conexión. Espera unos minutos y vuelve a intentarlo.',
        };
      }
      entry.count += 1;
      dayCount += 1;
      return { ok: true };
    },

    stats() {
      return { day, dayCount, dailyLimit, activeIps: windows.size };
    },
  };
}
