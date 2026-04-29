import { useRef, useState, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const CDN_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg'
const CORE_VERSION = '0.12.10'

// Module-level singleton — survives tab switches and component remounts
let ffmpegInstance = null
let loadPromise = null

function getCoreUrls() {
  const mt = typeof SharedArrayBuffer !== 'undefined'
  const pkg = mt ? 'core-mt' : 'core'
  const base = `${CDN_BASE}/${pkg}@${CORE_VERSION}/dist/esm`
  return {
    coreURL: `${base}/ffmpeg-core.js`,
    wasmURL: `${base}/ffmpeg-core.wasm`,
    workerURL: mt ? `${base}/ffmpeg-core.worker.js` : undefined,
  }
}

async function initFFmpeg(onProgress) {
  if (ffmpegInstance) return ffmpegInstance
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const ff = new FFmpeg()

    ff.on('progress', ({ progress }) => {
      onProgress?.(Math.min(99, Math.round(progress * 100)))
    })

    if (import.meta.env.DEV) {
      ff.on('log', ({ message }) => console.debug('[FFmpeg]', message))
    }

    const { coreURL, wasmURL, workerURL } = getCoreUrls()

    // toBlobURL re-hosts CDN assets as blob:// (same-origin) to satisfy
    // COEP require-corp — jsdelivr doesn't send Cross-Origin-Resource-Policy headers
    const coreBlobURL = await toBlobURL(coreURL, 'text/javascript')
    const wasmBlobURL = await toBlobURL(wasmURL, 'application/wasm')

    const loadArgs = { coreURL: coreBlobURL, wasmURL: wasmBlobURL }

    if (workerURL) {
      loadArgs.workerURL = await toBlobURL(workerURL, 'text/javascript')
    }

    await ff.load(loadArgs)
    ffmpegInstance = ff
    return ff
  })()

  return loadPromise
}

export function useFFmpeg() {
  const [isLoaded, setIsLoaded] = useState(() => ffmpegInstance != null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [progress, setProgress] = useState(0)
  const progressRef = useRef(setProgress)
  progressRef.current = setProgress

  const ensureLoaded = useCallback(async () => {
    if (ffmpegInstance) {
      // Re-register progress listener for this hook instance
      ffmpegInstance.on('progress', ({ progress: p }) => {
        progressRef.current(Math.min(99, Math.round(p * 100)))
      })
      setIsLoaded(true)
      return ffmpegInstance
    }

    setIsLoading(true)
    setLoadError(null)

    try {
      const ff = await initFFmpeg((pct) => progressRef.current(pct))
      setIsLoaded(true)
      return ff
    } catch (err) {
      const msg = err?.message ?? 'Failed to load video engine'
      setLoadError(msg)
      loadPromise = null
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const runCommand = useCallback(
    async ({ inputs, args, outputName }) => {
      setProgress(0)
      const ff = await ensureLoaded()

      for (const { name, data } of inputs) {
        await ff.writeFile(name, await fetchFile(data))
      }

      await ff.exec(args)

      const output = await ff.readFile(outputName)

      for (const { name } of inputs) {
        await ff.deleteFile(name).catch(() => {})
      }
      await ff.deleteFile(outputName).catch(() => {})

      setProgress(100)
      return output
    },
    [ensureLoaded],
  )

  return { isLoaded, isLoading, loadError, progress, setProgress, runCommand, ensureLoaded }
}
