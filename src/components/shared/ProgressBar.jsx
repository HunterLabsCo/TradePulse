export default function ProgressBar({ progress, label = 'Processing…' }) {
  if (progress <= 0) return null
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="font-semibold text-lime">{progress}%</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border-default">
        <div
          className="h-full rounded-full bg-lime transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
        {progress < 100 && (
          <div className="absolute inset-0 animate-scan-line bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}
      </div>
    </div>
  )
}
