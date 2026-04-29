export default function Header() {
  return (
    <header className="w-full border-b border-border-subtle px-5 py-4">
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 2l4 4-4 4" />
            <path d="M3 11V9a4 4 0 014-4h14" />
            <path d="M7 22l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 01-4 4H3" />
          </svg>
        </div>
        <div>
          <h1 className="font-heading text-lg font-bold leading-none tracking-tight text-lime text-glow-lime">
            Loopd
          </h1>
          <p className="text-[10px] leading-none text-text-muted">Make it loop.</p>
        </div>
        <span className="ml-auto rounded border border-border-subtle px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-text-muted">
          GIF Maker
        </span>
      </div>
    </header>
  )
}
