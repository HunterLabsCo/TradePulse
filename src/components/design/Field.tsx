import type { CSSProperties } from "react";

interface FieldProps {
  k: string;
  v: string;
  highlight?: boolean;
  wide?: boolean;
}

export function Field({ k, v, highlight = false, wide = false }: FieldProps) {
  const wrapStyle: CSSProperties | undefined = wide ? { gridColumn: "span 2" } : undefined;
  return (
    <div style={wrapStyle}>
      <div className="font-mono text-[9.5px] text-mist-text-dim tracking-[0.1em] uppercase">
        {k}
      </div>
      <div
        className="font-sans font-medium mt-1 tracking-[-0.01em] leading-[1.1]"
        style={{
          fontSize: highlight ? 22 : 16,
          color: highlight ? "var(--mist-primary)" : "var(--mist-text)",
        }}
      >
        {v}
      </div>
    </div>
  );
}
