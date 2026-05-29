interface MiniBarsProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  neg?: string;
  gap?: number;
}

export function MiniBars({
  data,
  width = 100,
  height = 26,
  color = "#000",
  neg = "#aa2222",
  gap = 2,
}: MiniBarsProps) {
  const max = Math.max(...data.map(Math.abs));
  const barW = (width - gap * (data.length - 1)) / data.length;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <line
        x1={0}
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke={color}
        strokeOpacity={0.2}
        strokeWidth={0.7}
      />
      {data.map((d, i) => {
        const x = i * (barW + gap);
        const h = (Math.abs(d) / max) * (height / 2 - 2);
        const y = d >= 0 ? height / 2 - h : height / 2;
        return (
          <rect key={i} x={x} y={y} width={barW} height={h} fill={d >= 0 ? color : neg} rx={barW / 4} />
        );
      })}
    </svg>
  );
}
