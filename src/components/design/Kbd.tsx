import React from 'react';

interface KbdProps {
  children: React.ReactNode;
}

export function Kbd({ children }: KbdProps) {
  return (
    <kbd className="inline-block py-px px-[5px] bg-[#0a0e0c] border border-[#222a25] text-[#7a8a75] font-mono text-[9.5px] font-medium tracking-[0.04em] leading-[1.4] rounded-[2px]">
      {children}
    </kbd>
  );
}
