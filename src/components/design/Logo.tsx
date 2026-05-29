interface LogoProps {
  size?: number;
}

export function Logo({ size = 16 }: LogoProps) {
  return (
    <div className="flex items-center gap-[7px] text-mist-primary">
      <svg width={size + 2} height={size + 2} viewBox="0 0 22 22">
        <rect x="2" y="2" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M5 13 L8 9 L11 14 L14 7 L17 11"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="font-mono font-semibold text-mist-primary tracking-[0.02em]"
        style={{ fontSize: size - 1 }}
      >
        tradepulse
      </span>
    </div>
  );
}
