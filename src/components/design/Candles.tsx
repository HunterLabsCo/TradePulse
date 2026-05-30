import React from 'react';

const DEFAULT_CANDLES: [number, number, number, number][] = [
  [42, 47, 41, 45], [45, 46, 43, 44], [44, 48, 43, 47], [47, 52, 46, 50],
  [50, 55, 49, 54], [54, 56, 51, 52], [52, 59, 51, 58], [58, 62, 56, 61],
  [61, 63, 58, 60], [60, 65, 60, 64], [64, 68, 62, 67], [67, 72, 66, 71],
  [71, 73, 69, 70], [70, 74, 68, 72], [72, 78, 72, 77], [77, 82, 76, 80],
  [80, 84, 78, 79], [79, 83, 77, 82], [82, 87, 81, 85], [85, 89, 84, 87],
];

interface CandlesProps {
  width?: number;
  height?: number;
  color?: string;
  red?: string;
  bg?: string;
  candles?: [number, number, number, number][];
}

export function Candles({
  width = 220,
  height = 80,
  color = '#a8d4ad',
  red = '#e89a8a',
  bg = 'transparent',
  candles = DEFAULT_CANDLES,
}: CandlesProps) {
  const lo = Math.min(...candles.flat());
  const hi = Math.max(...candles.flat());
  const cw = (width - 4) / candles.length;
  const yVal = (v: number) => height - 4 - ((v - lo) / (hi - lo)) * (height - 8);

  return (
    <svg width={width} height={height} style={{ display: 'block', background: bg }}>
      {candles.map(([o, h, l, c], i) => {
        const up = c >= o;
        const col = up ? color : red;
        const x = i * cw + 2 + cw / 2;
        const bodyTop = yVal(Math.max(o, c));
        const bodyH = Math.max(1, Math.abs(yVal(o) - yVal(c)));
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={yVal(h)} y2={yVal(l)} stroke={col} strokeWidth={1} />
            <rect x={x - cw / 2 + 1} y={bodyTop} width={cw - 2} height={bodyH} fill={col} />
          </g>
        );
      })}
    </svg>
  );
}
