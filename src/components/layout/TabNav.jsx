export default function TabNav({ tabs, activeTab, onTabChange }) {
  return (
    <nav className="w-full border-b border-border-subtle">
      <div className="mx-auto flex max-w-2xl">
        {tabs.map((tab) => {
          const active = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 px-2 py-3.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
                active ? 'text-lime' : 'text-text-secondary hover:text-white'
              }`}
            >
              {tab.label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-lime shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
