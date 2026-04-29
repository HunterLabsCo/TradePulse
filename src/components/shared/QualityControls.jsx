const WIDTH_OPTIONS = [
  { value: 240, label: '240px — tiny' },
  { value: 320, label: '320px — small' },
  { value: 480, label: '480px — medium' },
  { value: 640, label: '640px — large' },
  { value: 720, label: '720px — HD' },
  { value: 'original', label: 'Original' },
]

export default function QualityControls({ value, onChange }) {
  const { fps, width, dither } = value

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium uppercase tracking-widest text-text-secondary">
            Frame Rate
          </label>
          <span className="text-sm font-semibold text-lime">{fps} fps</span>
        </div>
        <input
          type="range"
          min={5}
          max={30}
          step={1}
          value={fps}
          onChange={(e) => onChange({ ...value, fps: Number(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none bg-border-default cursor-pointer"
        />
        <div className="mt-1 flex justify-between text-[10px] text-text-muted">
          <span>5fps</span>
          <span>30fps</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-text-secondary">
          Output Width
        </label>
        <div className="grid grid-cols-3 gap-2">
          {WIDTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...value, width: opt.value })}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                width === opt.value
                  ? 'border-lime bg-lime/10 text-lime'
                  : 'border-border-default bg-elevated text-text-secondary hover:border-border-subtle hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">Dithering</p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            {dither ? 'Better quality, larger file' : 'Smaller file, lower quality'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={dither}
          onClick={() => onChange({ ...value, dither: !dither })}
          className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none ${
            dither ? 'bg-lime' : 'bg-border-default'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-black transition-transform ${
              dither ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
