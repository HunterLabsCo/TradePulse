import { useState, useEffect, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import DropZone from '@/components/shared/DropZone'
import QualityControls from '@/components/shared/QualityControls'
import ProgressBar from '@/components/shared/ProgressBar'
import GifPreview from '@/components/shared/GifPreview'
import ExportPanel from '@/components/shared/ExportPanel'
import ImageSorter from './ImageSorter'
import { useFFmpeg } from '@/hooks/useFFmpeg'
import { buildImageSequenceArgs, runTwoPassGif } from '@/utils/ffmpegCommands'
import { uint8ArrayToObjectURL, downloadFile, getMimeType, buildConcatFilelist, padNumber, getExtension } from '@/utils/fileUtils'

const DEFAULT_QUALITY = { fps: 10, width: 480, dither: true }

export default function ImageSequence() {
  const [images, setImages] = useState([])
  const [frameDurationMs, setFrameDurationMs] = useState(100)
  const [quality, setQuality] = useState(DEFAULT_QUALITY)
  const [format, setFormat] = useState('gif')
  const [phase, setPhase] = useState('idle')
  const [outputURL, setOutputURL] = useState(null)
  const [outputSize, setOutputSize] = useState(null)
  const [error, setError] = useState(null)

  const { isLoading, loadError, progress, ensureLoaded } = useFFmpeg()
  const outputURLRef = useRef(null)

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewURL))
      if (outputURLRef.current) URL.revokeObjectURL(outputURLRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFiles = (files) => {
    const newImages = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      previewURL: URL.createObjectURL(file),
    }))
    setImages((prev) => [...prev, ...newImages])
    setPhase('idle'); setOutputURL(null); setOutputSize(null); setError(null)
  }

  const handleConvert = async () => {
    if (images.length < 2) return
    setPhase('converting'); setError(null)
    try {
      const ff = await ensureLoaded()
      const jobId = Date.now()
      const paletteName = `palette_${jobId}.png`
      const outputName = `output_${jobId}.gif`
      const fileListName = `list_${jobId}.txt`

      const frameInputs = images.map((img, i) => ({
        name: `frame_${jobId}_${padNumber(i)}.${getExtension(img.file)}`,
        data: img.file,
      }))

      const filelistContent = buildConcatFilelist(frameInputs.map((f) => f.name), frameDurationMs)
      await ff.writeFile(fileListName, new TextEncoder().encode(filelistContent))

      const { pass1, pass2 } = buildImageSequenceArgs({
        fileListName, paletteName, outputName,
        fps: quality.fps, width: quality.width, dither: quality.dither,
      })

      const data = await runTwoPassGif({
        ff, inputs: frameInputs,
        pass1Args: pass1, pass2Args: pass2, paletteName, outputName,
      })

      await ff.deleteFile(fileListName).catch(() => {})

      const url = uint8ArrayToObjectURL(data, getMimeType(format))
      if (outputURLRef.current) URL.revokeObjectURL(outputURLRef.current)
      outputURLRef.current = url
      setOutputURL(url); setOutputSize(data.byteLength); setPhase('done')
    } catch (err) {
      setError(err?.message ?? 'Conversion failed'); setPhase('idle')
    }
  }

  const handleDownload = () => { if (outputURL) downloadFile(outputURL, `sequence.${format}`) }

  const handleReset = () => {
    if (outputURLRef.current) { URL.revokeObjectURL(outputURLRef.current); outputURLRef.current = null }
    images.forEach((img) => URL.revokeObjectURL(img.previewURL))
    setImages([]); setOutputURL(null); setOutputSize(null); setPhase('idle'); setError(null)
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
      {phase !== 'done' && (
        <DropZone
          accept={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
          multiple
          onFiles={handleFiles}
          label={images.length === 0 ? 'Drop images here' : 'Add more images'}
          sublabel="JPG, PNG, WebP · Drag to reorder after uploading"
        />
      )}
      {images.length > 0 && phase !== 'done' && (
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-widest text-text-secondary">
              {images.length} Frame{images.length !== 1 ? 's' : ''} · Drag to reorder
            </h3>
            <button onClick={handleReset} className="text-xs text-text-muted hover:text-white">Clear all</button>
          </div>
          <ImageSorter images={images} onChange={setImages} />
        </div>
      )}
      {images.length > 0 && phase !== 'done' && (
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-widest text-text-secondary">Frame Delay</label>
            <span className="text-sm font-semibold text-lime">
              {frameDurationMs}ms
              <span className="ml-1 text-[11px] font-normal text-text-muted">({(1000 / frameDurationMs).toFixed(1)} fps)</span>
            </span>
          </div>
          <input type="range" min={50} max={1000} step={10} value={frameDurationMs} onChange={(e) => setFrameDurationMs(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none bg-border-default cursor-pointer" />
          <div className="mt-1 flex justify-between text-[10px] text-text-muted"><span>50ms (fast)</span><span>1000ms (slow)</span></div>
        </div>
      )}
      {images.length > 0 && phase !== 'done' && (
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-widest text-text-secondary">Quality Settings</h3>
          <QualityControls value={quality} onChange={setQuality} />
        </div>
      )}
      {showProgress && (
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <ProgressBar progress={isLoading ? 0 : progress} label={isLoading ? 'Loading video engine…' : 'Stitching frames…'} />
        </div>
      )}
      {images.length >= 2 && phase !== 'done' && (
        <ExportPanel format={format} onFormatChange={setFormat} onConvert={handleConvert} isProcessing={isConverting} canConvert={images.length >= 2 && !isConverting} convertLabel={`Create ${format.toUpperCase()}`} />
      )}
      {images.length === 1 && phase !== 'done' && (
        <p className="text-center text-xs text-text-muted">Add at least 2 images to create an animation.</p>
      )}
      {phase === 'done' && outputURL && (
        <GifPreview src={outputURL} fileSize={outputSize} format={format} onDownload={handleDownload} onReset={handleReset} />
      )}
    </div>
  )
}
