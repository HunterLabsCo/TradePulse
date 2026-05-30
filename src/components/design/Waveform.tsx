import { useState, useEffect } from 'react';

interface WaveformProps {
  bars?: number;
  color?: string;
  active?: boolean;
  height?: number;
  gap?: number;
  width?: number;
  rounded?: boolean;
}

export function Waveform({
  bars = 28,
  color = 'currentColor',
  active = true,
  height = 32,
  gap = 3,
  width = 3,
  rounded = true,
}: WaveformProps) {
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf: number;
    const tick = () => {
      setT(performance.now() / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap, height }}>
      {Array.from({ length: bars }, (_, i) => {
        const phase = t * 3.5 + i * 0.35;
        const amp =
          active && !reducedMotion
            ? Math.abs(Math.sin(phase)) * 0.55 +
              Math.abs(Math.sin(phase * 2.3)) * 0.3 +
              0.15
            : 0.22 + Math.sin(i) * 0.08;
        const h = Math.max(4, height * Math.min(1, amp));
        return (
          <div
            key={i}
            style={{
              width,
              height: h,
              background: color,
              borderRadius: rounded ? width : 0,
              transition: active && !reducedMotion ? 'none' : 'height .3s',
            }}
          />
        );
      })}
    </div>
  );
}
