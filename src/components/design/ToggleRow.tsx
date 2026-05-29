interface ToggleRowProps {
  label: string;
  on?: boolean;
  last?: boolean;
  onChange?: () => void;
}

export function ToggleRow({ label, on = false, last = false, onChange }: ToggleRowProps) {
  return (
    <div
      className={`flex items-center justify-between py-[14px] ${last ? "" : "border-b border-mist-border"}`}
    >
      <span className="font-sans text-[14.5px] text-mist-text tracking-[-0.005em]">{label}</span>
      <button
        type="button"
        onClick={onChange}
        className={`relative w-[36px] h-[20px] rounded-[10px] border ${
          on ? "bg-mist-primary border-mist-primary" : "bg-mist-bg-raised border-mist-border"
        }`}
      >
        <span
          className={`absolute top-px w-[16px] h-[16px] rounded-full transition-[left] duration-150 ease-in-out ${
            on ? "bg-mist-bg left-[16px]" : "bg-mist-text-dim left-px"
          }`}
        />
      </button>
    </div>
  );
}
