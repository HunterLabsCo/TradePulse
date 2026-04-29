import { useState, useEffect, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import DropZone from '@/components/shared/DropZone'
import QualityControls from '@/components/shared/QualityControls'
import ProgressBar from '@/components/shared/ProgressBar'
import GifPreview from '@/components/shared/GifPreview'
import ExportPanel from '@/components/shared/ExportPanel'
import TimelineScrubber from './TimelineScrubber'
import { useFFmpeg } from '@/hooks/useFFmpeg'
import {
  buildVideoToGifArgs, buildWebPArgs, buildMP4Args, runTwoPassGif, runSinglePass,
} from '@/utils/ffmpegCommands'
import { uint8ArrayToObjectURL, downloadFile, getMimeType, getExtension } from '@/utils/fileUtils'

const DEFAULT_QUALITY = { fps: 15, width: 480, dither: true }

export default function VideoConverter() {
  const [videoFile, setVideoFile] = useState(null)
  const [trimRange, setTrimRange] = useState({ start: 0, end: 0 })
  const [quality, setQuality] = useState(DEFAULT_QUALITY)
  const [format, setFormat] = useState('gif')
  const [phase, setPhase] = useState('idle')
  const [outputURL, setOutputURL] = useState(null)
  const [outputSize, setOutputSize] = useState(null)
  const [error, setError] = useState(null)

  const { isLoading, loadError, progress, ensureLoaded } = useFFmpeg()
  const outputURLRef = useRef(null)

  useEffect(() => {
    return () => { if (outputURLRef.current) URL.revokeObjectURL(outputURLRef.current) }
  }, [])

  const handleFiles = (files) => {
    if (outputURLRef.current) { URL.revokeObjectURL(outputURLRef.current); outputURLRef.current = null }
    setVideoFile(files[0])
    setOutputURL(null)
    setOutputSize(null)
    setPhase('idle')
    setError(null)
  }

  const handleConvert = async () => {
    if (!videoFile) return
    setPhase('converting')
    setError(null)
    try {
      const ff = await ensureLoaded()
      const jobId = Date.now()
      const ext = getExtension(videoFile)
      const inputName = `input_${jobId}.${ext}`
      const paletteName = `palette_${jobId}.png`
      const outputName = `output_${jobId}.${format}`
      let data

      if (format === 'gif') {
        const { pass1, pass2 } = buildVideoToGifArgs({
          inputName, paletteName, outputName,
          fps: quality.fps, width: quality.width,
          startTime: trimRange.start, endTime: trimRange.end,
          dither: quality.dither,
        })
        data = await runTwoPassGif({
          ff, inputs: [{ name: inputName, data: videoFile }],
          pass1Args: pass1, pass2Args: pass2, paletteName, outputName,
        })
      } else if (format === 'webp') {
        const args = buildWebPArgs({
          inputName, outputName, fps: quality.fps, width: quality.width,
          startTime: trimRange.start, endTime: trimRange.end,
        })
        data = await runSinglePass({ ff, inputs: [{ name: inputName, data: videoFile }], args, outputName })
      } else {
        const args = buildMP4Args({
          inputName, outputName, width: quality.width,
          startTime: trimRange.start, endTime: trimRange.end,
        })
        data = await runSinglePass({ ff, inputs: [{ name: inputName, data: videoFile }], args, outputName })
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

  const handleDownload = () => {
    if (!outputURL) return
    downloadFile(outputURL, `${videoFile?.name.replace(/\.[^.]+$/, '') ?? 'loopd'}.${format}`)
  }

  const handleReset = () => {
    if (outputURLRef.current) { URL.revokeObjectURL(outputURLRef.current); outputURLRef.current = null }
    setVideoFile(null)
    setOutputURL(null)
    setOutputSize(null)
    setPhase('idle')
    setError(null)
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
      {(loadError || error) && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <p className="text-sm text-red-400">{loadError ?? error}</p>
        </div>
      )}
      {!videoFile ? (
        <DropZone
          accept={['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/']}
          onFiles={handleFiles}
          label="Drop a video file here"
          sublabel="MP4, MOV, WebM, AVI · Max 200MB recommended"
        />
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">{videoFile.name}</p>
            <p className="text-xs text-text-muted">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
          <button onClick={handleReset} className="text-xs text-text-muted transition-colors hover:text-white">Remove</button>
        </div>
      )}
      {videoFile && phase !== 'done' && (
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-text-secondary">Trim Clip</h3>
          <TimelineScrubber videoFile={videoFile} value={trimRange} onChange={setTrimRange} />
        </div>
      )}
      {videoFile && phase !== 'done' && (
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-widest text-text-secondary">Quality Settings</h3>
          <QualityControls value={quality} onChange={setQuality} />
        </div>
      )}
      {showProgress && (
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <ProgressBar
            progress={isLoading ? 0 : progress}
            label={isLoading ? 'Loading video engine…' : `Converting to ${format.toUpperCase()}…`}
          />
          {isLoading && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border-default">
              <div className="h-full animate-scan-line bg-gradient-to-r from-transparent via-electric/40 to-transparent" />
            </div>
          )}
        </div>
      )}
      {videoFile && phase !== 'done' && (
        <ExportPanel
          format={format}
          onFormatChange={setFormat}
          onConvert={handleConvert}
          isProcessing={isConverting}
          canConvert={!!videoFile && !isConverting}
          convertLabel={`Convert to ${format.toUpperCase()}`}
        />
      )}
      {phase === 'done' && outputURL && (
        <GifPreview
          src={outputURL}
          fileSize={outputSize}
          format={format}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
