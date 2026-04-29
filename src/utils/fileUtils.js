export function uint8ArrayToObjectURL(data, mimeType) {
  const blob = new Blob([data.buffer], { type: mimeType })
  return URL.createObjectURL(blob)
}

export function downloadFile(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function buildConcatFilelist(filenames, frameDurationMs) {
  const durationSec = (frameDurationMs / 1000).toFixed(4)
  const lines = filenames.map((name) => `file '${name}'\nduration ${durationSec}`)
  if (filenames.length > 0) lines.push(`file '${filenames[filenames.length - 1]}'`)
  return lines.join('\n') + '\n'
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const d = Math.floor((seconds % 1) * 10)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${d}`
}

export function padNumber(n, digits = 3) {
  return String(n).padStart(digits, '0')
}

export function getExtension(fileOrName) {
  const name = fileOrName instanceof File ? fileOrName.name : fileOrName
  return name.split('.').pop()?.toLowerCase() ?? ''
}

export function getMimeType(format) {
  switch (format) {
    case 'gif': return 'image/gif'
    case 'webp': return 'image/webp'
    case 'mp4': return 'video/mp4'
    default: return 'application/octet-stream'
  }
}
