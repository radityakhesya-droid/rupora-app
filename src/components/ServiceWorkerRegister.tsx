'use client';

import { useEffect } from 'react';

// The service worker is what keeps a phone serving an old build after a deploy,
// so it must be registered from inside the app (nothing else does it) and
// re-registered on every load so a new sw.js is picked up immediately.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    };

    if (document.readyState === 'complete') {
      register();
      return;
    }

    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}