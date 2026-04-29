import { Download, RefreshCw } from 'lucide-react'
import { formatFileSize } from '@/utils/fileUtils'

export default function GifPreview({ src, fileSize, format = 'gif', onDownload, onReset }) {
  if (!src) return null
  const formatLabels = { gif: 'GIF', webp: 'WebP', mp4: 'MP4' }
  const isVideo = format === 'mp4'
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-lime">
          Output Preview
        </h3>
        {fileSize != null && (
          <div className="flex items-center gap-2">
            <span className="rounded bg-elevated px-2 py-0.5 text-[11px] font-medium text-text-secondary">
              {formatLabels[format]}
            </span>
            <span className="text-xs text-text-muted">{formatFileSize(fileSize)}</span>
          </div>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
        {isVideo ? (
          <video src={src} autoPlay loop muted playsInline className="mx-auto max-h-64 w-auto" />
        ) : (
          <img src={src} alt="Output preview" className="mx-auto max-h-64 w-auto" />
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onDownload}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-lime px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-lime/90 active:scale-95"
        >
          <Download size={16} />
          Download {formatLabels[format]}
        </button>
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 rounded-xl border border-border-default px-4 py-3 text-sm text-text-secondary transition-all hover:border-border-subtle hover:text-white active:scale-95"
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
