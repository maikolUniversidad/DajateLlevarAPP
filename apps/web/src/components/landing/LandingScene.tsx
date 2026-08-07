'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// La escena WebGL solo en cliente: nunca en SSR.
const ParticleField = dynamic(() => import('./ParticleField'), { ssr: false });

/**
 * Contenedor fijo de la escena de fondo. Respeta prefers-reduced-motion
 * (muestra un degradado estático) y reduce partículas en móvil.
 */
export function LandingScene() {
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [count, setCount] = useState(2600);

  useEffect(() => {
    setMounted(true);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 640px)').matches;
    setCount(mobile ? 1200 : 2600);
    setAnimate(!reduce);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: 'radial-gradient(120% 90% at 50% 0%, #3a2e71 0%, #241f4a 45%, #1a1636 100%)',
      }}
    >
      {mounted && animate ? <ParticleField count={count} /> : null}
    </div>
  );
}
