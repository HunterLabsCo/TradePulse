import React from 'react';

interface ToggleRowProps {
  label: string;
  on?: boolean;
  last?: boolean;
  onChange?: () => void;
}

export function ToggleRow({ label, on = false, last = false, onChange }: ToggleRowProps) {
  return (
    <div
      className={`flex items-center justify-between py-[14px] ${!last ? 'border-b border-[#222a25]' : ''}`}
    >
      <span className="font-sans text-[14.5px] text-[#d8e0d2] tracking-[-0.005em]">
        {label}
      </span>
      <button
        role="switch"
        aria-checked={on}
        onClick={onChange}
        className="relative flex-shrink-0"
        style={{
          width: 36,
          height: 20,
          background: on ? '#8ec2dd' : '#161c19',
          border: `1px solid ${on ? '#8ec2dd' : '#222a25'}`,
          borderRadius: 10,
        }}
      >
        <span
          className="absolute top-px rounded-full transition-[left] duration-150 ease-in-out"
          style={{
            width: 16,
            height: 16,
            left: on ? 16 : 1,
            background: on ? '#0e1311' : '#7a8a75',
          }}
        />
      </button>
    </div>
  );
}
