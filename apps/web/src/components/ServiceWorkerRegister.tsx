'use client';

import { useEffect } from 'react';

/** Registra el service worker (solo en producción y con soporte del navegador). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Si falla el registro, la app sigue funcionando en línea con normalidad.
      });
    };
    // Si la página ya terminó de cargar (hidratación tardía), registra ya;
    // si no, espera al evento load para no competir con la carga inicial.
    if (document.readyState === 'complete') {
      register();
      return;
    }
    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);
  return null;
}
