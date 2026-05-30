import React from 'react';

interface SparklineProps {
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  dots?: boolean;
  data?: number[];
}

const DEFAULT_DATA = [0, 1.4, -0.3, 2.1, 1.6, 3.2, 2.4, -0.8, 1.1, 2.7, 4.5];

export function Sparkline({
  width = 100,
  height = 26,
  stroke = '#000',
  fill = 'none',
  strokeWidth = 1.5,
  dots = false,
  data = DEFAULT_DATA,
}: SparklineProps) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 4) + 2;
    const y = height - 2 - ((d - min) / (max - min)) * (height - 4);
    return [x, y] as [number, number];
  });
  const path = pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const area =
    fill !== 'none'
      ? path +
        ` L${pts[pts.length - 1][0].toFixed(1)} ${height} L${pts[0][0].toFixed(1)} ${height} Z`
      : null;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {area && <path d={area} fill={fill} stroke="none" />}
      <path
        d={path}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {dots &&
        pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.6} fill={stroke} />
        ))}
    </svg>
  );
}
