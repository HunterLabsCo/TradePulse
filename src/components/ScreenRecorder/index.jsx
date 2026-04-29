import { useState, useEffect, useRef } from 'react'
import { Monitor, Square, AlertCircle, MonitorOff } from 'lucide-react'
import QualityControls from '@/components/shared/QualityControls'
import ProgressBar from '@/components/shared/ProgressBar'
import GifPreview from '@/components/shared/GifPreview'
import ExportPanel from '@/components/shared/ExportPanel'
import { useFFmpeg } from '@/hooks/useFFmpeg'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'
import {
  buildVideoToGifArgs, buildWebPArgs, buildMP4Args, runTwoPassGif, runSinglePass,
} from '@/utils/ffmpegCommands'
import { uint8ArrayToObjectURL, downloadFile, getMimeType } from '@/utils/fileUtils'

const DEFAULT_QUALITY = { fps: 15, width: 480, dither: true }
const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia

export default function ScreenRecorder() {
  const [quality, setQuality] = useState(DEFAULT_QUALITY)
  const [format, setFormat] = useState('gif')
  const [phase, setPhase] = useState('idle')
  const [outputURL, setOutputURL] = useState(null)
  const [outputSize, setOutputSize] = useState(null)
  const [error, setError] = useState(null)
  const [previewURL, setPreviewURL] = useState(null)

  const { isLoading, loadError, progress, ensureLoaded } = useFFmpeg()
  const { isRecording, recordedBlob, error: recorderError, startRecording, stopRecording, reset: resetRecorder } = useMediaRecorder()

  const outputURLRef = useRef(null)
  const previewURLRef = useRef(null)

  useEffect(() => {
    return () => {
      if (outputURLRef.current) URL.revokeObjectURL(outputURLRef.current)
      if (previewURLRef.current) URL.revokeObjectURL(previewURLRef.current)
    }
  }, [])

  useEffect(() => { if (isRecording) setPhase('recording') }, [isRecording])

  useEffect(() => {
    if (!recordedBlob) return
    const url = URL.createObjectURL(recordedBlob)
    if (previewURLRef.current) URL.revokeObjectURL(previewURLRef.current)
    previewURLRef.current = url
    setPreviewURL(url)
    setPhase('idle')
  }, [recordedBlob])

  const handleConvert = async () => {
    if (!recordedBlob) return
    setPhase('converting')
    setError(null)
    try {
      const ff = await ensureLoaded()
      const jobId = Date.now()
      const inputName = `screen_${jobId}.webm`
      const paletteName = `palette_${jobId}.png`
      const outputName = `output_${jobId}.${format}`
      let data

      if (format === 'gif') {
        const { pass1, pass2 } = buildVideoToGifArgs({
          inputName, paletteName, outputName,
          fps: quality.fps, width: quality.width, dither: quality.dither,
        })
        data = await runTwoPassGif({
          ff, inputs: [{ name: inputName, data: recordedBlob }],
          pass1Args: pass1, pass2Args: pass2, paletteName, outputName,
        })
      } else if (format === 'webp') {
        const args = buildWebPArgs({ inputName, outputName, fps: quality.fps, width: quality.width })
        data = await runSinglePass({ ff, inputs: [{ name: inputName, data: recordedBlob }], args, outputName })
      } else {
        const args = buildMP4Args({ inputName, outputName, width: quality.width })
        data = await runSinglePass({ ff, inputs: [{ name: inputName, data: recordedBlob }], args, outputName })
      }

      const url = uint8ArrayToObjectURL(data, getMimeType(format))
      if (outputURLRef.current) URL.revokeObjectURL(outputURLRef.current)
      outputURLRef.current = url
      setOutputURL(url)
      setOutputSize(data.byteLength)
      setPhase('done')
    } catch (err) {
      setError(err?.message ?? 'Conversion failed')
      setPhase('idle')
    }
  }

  const handleDownload = () => { if (outputURL) downloadFile(outputURL, `screen-recording.${format}`) }

  const handleReset = () => {
    if (outputURLRef.current) { URL.revokeObjectURL(outputURLRef.current); outputURLRef.current = null }
    if (previewURLRef.current) { URL.revokeObjectURL(previewURLRef.current); previewURLRef.current = null }
    resetRecorder()
    setOutputURL(null); setOutputSize(null); setPreviewURL(null); setPhase('idle'); setError(null)
  }

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <MonitorOff size={40} className="text-text-muted" />
        <div>
          <h3 className="font-heading text-lg font-bold">Not Supported</h3>
          <p className="mt-1 text-sm text-text-secondary">Screen recording requires a desktop browser. Try Chrome or Firefox on desktop.</p>
        </div>
      </div>
    )
  }

  const isConverting = phase === 'converting'
  const showProgress = isConverting || isLoading

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-electric/30 bg-electric/5 px-4 py-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-electric border-t-transparent" />
          <span className="text-sm text-electric">Loading video engine…</span>
        </div>
      )}
      {(loadError || error || recorderError) && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <p className="text-sm text-red-400">{loadError ?? error ?? recorderError}</p>
        </div>
      )}
      {phase !== 'done' && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border-subtle bg-surface p-8">
          {phase === 'recording' ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 animate-glow-pulse">
                <div className="h-4 w-4 rounded-sm bg-red-500" />
              </div>
              <p className="text-sm font-medium text-white">Recording…</p>
              <button onClick={stopRecording} className="flex items-center gap-2 rounded-xl border border-red-500 bg-red-500/10 px-6 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 active:scale-95">
                <Square size={14} fill="currentColor" /> Stop Recording
              </button>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime/10">
                <Monitor size={28} className="text-lime" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">Ready to record</p>
                <p className="mt-1 text-xs text-text-muted">Click below to share your screen or a window</p>
              </div>
              <button onClick={startRecording} disabled={isConverting} className="flex items-center gap-2 rounded-xl bg-lime px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-lime/90 active:scale-95 disabled:opacity-40 shadow-[0_0_20px_rgba(57,255,20,0.3)]">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" /> Start Recording
              </button>
            </>
          )}
        </div>
      )}
      {previewURL && phase !== 'done' && (
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-widest text-text-secondary">Recorded Clip</h3>
            <button onClick={handleReset} className="text-xs text-text-muted hover:text-white">Discard</button>
          </div>
          <video src={previewURL} controls className="w-full rounded-lg bg-black" style={{ maxHeight: '240px' }} />
        </div>
      )}
      {recordedBlob && phase !== 'done' && (
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-widest text-text-secondary">Quality Settings</h3>
          <QualityControls value={quality} onChange={setQuality} />
        </div>
      )}
      {showProgress && (
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <ProgressBar progress={isLoading ? 0 : progress} label={isLoading ? 'Loading video engine…' : `Converting to ${format.toUpperCase()}…`} />
        </div>
      )}
      {recordedBlob && phase !== 'done' && (
        <ExportPanel format={format} onFormatChange={setFormat} onConvert={handleConvert} isProcessing={isConverting} canConvert={!!recordedBlob && !isConverting} convertLabel={`Convert to ${format.toUpperCase()}`} />
      )}
      {phase === 'done' && outputURL && (
        <GifPreview src={outputURL} fileSize={outputSize} format={format} onDownload={handleDownload} onReset={handleReset} />
      )}
    </div>
  )
}
