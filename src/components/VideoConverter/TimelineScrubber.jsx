import { useRef, useState, useEffect, useCallback } from 'react'
import { formatTime } from '@/utils/fileUtils'

export default function TimelineScrubber({ videoFile, value, onChange }) {
  const [duration, setDuration] = useState(0)
  const trackRef = useRef(null)
  const draggingRef = useRef(null)

  useEffect(() => {
    if (!videoFile) return
    const url = URL.createObjectURL(videoFile)
    const vid = document.createElement('video')
    vid.preload = 'metadata'
    vid.onloadedmetadata = () => {
      setDuration(vid.duration)
      onChange({ start: 0, end: vid.duration })
      URL.revokeObjectURL(url)
    }
    vid.src = url
    return () => URL.revokeObjectURL(url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoFile])

  const getPercent = useCallback(
    (seconds) => (duration > 0 ? (seconds / duration) * 100 : 0),
    [duration],
  )

  const secondsFromPointer = useCallback(
    (clientX) => {
      if (!trackRef.current || duration === 0) return 0
      const { left, width } = trackRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - left) / width))
      return ratio * duration
    },
    [duration],
  )

  const handlePointerDown = (handle) => (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = handle
  }

  const handlePointerMove = useCallback(
    (e) => {
      if (!draggingRef.current) return
      const t = secondsFromPointer(e.clientX)
      if (draggingRef.current === 'start') {
        onChange({ start: Math.min(t, value.end - 0.1), end: value.end })
      } else {
        onChange({ start: value.start, end: Math.max(t, value.start + 0.1) })
      }
    },
    [secondsFromPointer, onChange, value],
  )

  const handlePointerUp = () => { draggingRef.current = null }

  if (duration === 0) return null

  const startPct = getPercent(value.start)
  const endPct = getPercent(value.end)

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-text-secondary">
        <span>{formatTime(value.start)}</span>
        <span className="text-text-muted">Duration: {formatTime(value.end - value.start)}</span>
        <span>{formatTime(value.end)}</span>
      </div>
      <div
        ref={trackRef}
        className="relative h-8 cursor-pointer select-none rounded-lg bg-elevated"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="absolute inset-y-0 left-0 rounded-l-lg bg-black/60" style={{ width: `${startPct}%` }} />
        <div className="absolute inset-y-0 right-0 rounded-r-lg bg-black/60" style={{ width: `${100 - endPct}%` }} />
        <div
          className="absolute inset-y-0 border-y-2 border-lime bg-lime/10"
          style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-3 -ml-1.5 flex cursor-ew-resize items-center justify-center rounded-l-lg bg-lime"
          style={{ left: `${startPct}%` }}
          onPointerDown={handlePointerDown('start')}
        >
          <div className="h-4 w-0.5 rounded-full bg-black/60" />
        </div>
        <div
          className="absolute top-0 bottom-0 w-3 -mr-1.5 flex cursor-ew-resize items-center justify-center rounded-r-lg bg-lime"
          style={{ right: `${100 - endPct}%` }}
          onPointerDown={handlePointerDown('end')}
        >
          <div className="h-4 w-0.5 rounded-full bg-black/60" />
        </div>
      </div>
      <p className="text-[11px] text-text-muted">Drag handles to trim · Total: {formatTime(duration)}</p>
    </div>
  )
}
