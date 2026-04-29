import { useRef, useState, useCallback } from 'react'
import { Upload } from 'lucide-react'

export default function DropZone({ accept = [], multiple = false, onFiles, label, sublabel }) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  const filterFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList)
      if (!accept.length) return files
      return files.filter((f) => accept.some((type) => f.type.startsWith(type.replace('*', ''))))
    },
    [accept],
  )

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      const filtered = filterFiles(e.dataTransfer.files)
      if (filtered.length) onFiles(multiple ? filtered : [filtered[0]])
    },
    [filterFiles, multiple, onFiles],
  )

  const handleChange = useCallback(
    (e) => {
      const filtered = filterFiles(e.target.files)
      if (filtered.length) onFiles(multiple ? filtered : [filtered[0]])
      e.target.value = ''
    },
    [filterFiles, multiple, onFiles],
  )

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-default p-10 text-center cursor-pointer transition-all duration-200 select-none ${
        dragActive ? 'drop-active' : 'hover:border-border-subtle hover:bg-surface/50'
      }`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
          dragActive ? 'bg-lime/20 text-lime' : 'bg-elevated text-text-secondary'
        }`}
      >
        <Upload size={22} strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {sublabel && <p className="mt-1 text-xs text-text-muted">{sublabel}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept.join(',')}
        multiple={multiple}
        onChange={handleChange}
      />
    </div>
  )
}
