'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { FORMATION_ORDER, buildFormations, hubPos } from './formations';

const VIOLETA = new THREE.Color('#7c3aed');
const LILA = new THREE.Color('#a78bfa');
const BLANCO = new THREE.Color('#ede9fe');

/** Textura circular suave para que cada partícula sea un punto con halo. */
function useSpriteTexture() {
  return useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.25, 'rgba(255,255,255,0.85)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function Particles({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useRef(0);
  const smoothed = useRef(0);
  const sprite = useSpriteTexture();

  const f = useMemo(() => buildFormations(count), [count]);

  // Posición viva (mutable) que interpola entre formaciones.
  const positions = useMemo(() => f.cloud.slice(), [f]);

  // Color y fase de oscilación por partícula (fijos).
  const { colors, phases } = useMemo(() => {
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      c.copy(r < 0.12 ? BLANCO : r < 0.62 ? VIOLETA : LILA);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { colors, phases };
  }, [count]);

  // Subconjunto de líneas empresa/cliente/creador → su hub (formación 3).
  const lineStride = 5;
  const lineCount = Math.floor(count / lineStride);
  const linePositions = useMemo(() => new Float32Array(lineCount * 2 * 3), [lineCount]);

  useEffect(() => {
    const onScroll = () => {
      // El progreso se mide sobre la narrativa (no sobre toda la página), para
      // que las formaciones se completen justo al terminar el relato.
      const narrative = document.getElementById('landing-narrative');
      const span = narrative
        ? narrative.offsetHeight - window.innerHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      scroll.current = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useFrame((state) => {
    // Suaviza el avance del scroll para que la transformación no tiemble.
    smoothed.current += (scroll.current - smoothed.current) * 0.08;
    const p = smoothed.current;
    const t = p * (FORMATION_ORDER.length - 1); // 0..4
    const i = Math.min(FORMATION_ORDER.length - 2, Math.floor(t));
    const blend = smoothstep(t - i);

    const from = f[FORMATION_ORDER[i] ?? 'cloud'];
    const to = f[FORMATION_ORDER[i + 1] ?? 'calm'];
    const time = state.clock.elapsedTime;

    for (let k = 0; k < count; k++) {
      const o = k * 3;
      const idle = Math.sin(time * 0.6 + (phases[k] ?? 0)) * 0.06;
      const fx = from[o] ?? 0;
      const fy = from[o + 1] ?? 0;
      const fz = from[o + 2] ?? 0;
      const tx = to[o] ?? 0;
      const ty = to[o + 1] ?? 0;
      const tz = to[o + 2] ?? 0;
      positions[o] = fx + (tx - fx) * blend;
      positions[o + 1] = fy + (ty - fy) * blend + idle;
      positions[o + 2] = fz + (tz - fz) * blend;
    }

    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      attr.needsUpdate = true;
    }

    // Líneas de conexión: visibles alrededor de la formación de clústeres (t≈3).
    const linkVisibility = Math.max(0, 1 - Math.abs(t - 3)) * 0.5;
    if (lineMatRef.current) lineMatRef.current.opacity = linkVisibility;
    if (linkVisibility > 0.001 && linesRef.current) {
      for (let l = 0; l < lineCount; l++) {
        const src = l * lineStride;
        const so = src * 3;
        const hub = hubPos(f.hubOf[src] ?? 0);
        const lo = l * 6;
        linePositions[lo] = positions[so] ?? 0;
        linePositions[lo + 1] = positions[so + 1] ?? 0;
        linePositions[lo + 2] = positions[so + 2] ?? 0;
        linePositions[lo + 3] = hub[0];
        linePositions[lo + 4] = hub[1];
        linePositions[lo + 5] = hub[2];
      }
      const lattr = linesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      lattr.needsUpdate = true;
    }

    // Rotación lenta + parallax sutil con el puntero.
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time * 0.05) * 0.25 + state.pointer.x * 0.15;
      groupRef.current.rotation.x = -0.05 + state.pointer.y * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.075}
          map={sprite}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={lineMatRef}
          color="#a78bfa"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

function Rig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 14);
  }, [camera]);
  return null;
}

export default function ParticleField({ count = 2600 }: { count?: number }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 45, position: [0, 0, 14] }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <Rig />
      <Particles count={count} />
    </Canvas>
  );
}
