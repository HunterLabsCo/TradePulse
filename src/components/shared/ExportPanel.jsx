import { Loader2, Zap } from 'lucide-react'

const FORMAT_OPTIONS = [
  { id: 'gif', label: 'GIF', desc: 'Universal, widely supported' },
  { id: 'webp', label: 'WebP', desc: 'Smaller, better quality' },
  { id: 'mp4', label: 'MP4', desc: 'Video, great for social' },
]

export default function ExportPanel({
  format, onFormatChange, onConvert, isProcessing, canConvert = true, convertLabel = 'Convert',
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-text-secondary">
          Export Format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onFormatChange(opt.id)}
              disabled={isProcessing}
              className={`flex flex-col items-center rounded-xl border px-3 py-3 text-center transition-all ${
                format === opt.id
                  ? 'border-electric bg-electric/10 text-electric'
                  : 'border-border-default bg-elevated text-text-secondary hover:border-border-subtle hover:text-white'
              } disabled:opacity-40`}
            >
              <span className="text-sm font-semibold">{opt.label}</span>
              <span className="mt-0.5 text-[10px] leading-tight">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={onConvert}
        disabled={!canConvert || isProcessing}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all active:scale-95 ${
          canConvert && !isProcessing
            ? 'bg-lime text-black hover:bg-lime/90 shadow-[0_0_20px_rgba(57,255,20,0.3)]'
            : 'bg-elevated text-text-muted cursor-not-allowed'
        }`}
      >
        {isProcessing ? (
          <><Loader2 size={16} className="animate-spin" />Processing…</>
        ) : (
          <><Zap size={16} />{convertLabel}</>
        )}
      </button>
    </div>
  )
}
