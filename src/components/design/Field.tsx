import React from 'react';

interface FieldProps {
  k: string;
  v: string;
  highlight?: boolean;
  wide?: boolean;
}

export function Field({ k, v, highlight = false, wide = false }: FieldProps) {
  return (
    <div style={wide ? { gridColumn: 'span 2' } : undefined}>
      <div className="font-mono text-[9.5px] text-[#7a8a75] tracking-[0.1em] uppercase">
        {k}
      </div>
      <div
        className="font-sans font-medium mt-1 tracking-[-0.01em] leading-[1.1]"
        style={{
          fontSize: highlight ? 22 : 16,
          color: highlight ? '#8ec2dd' : '#d8e0d2',
        }}
      >
        {v}
      </div>
    </div>
  );
}
