import { useRef, useState, useCallback } from 'react'

export function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [error, setError] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  const startRecording = useCallback(async () => {
    setError(null)
    setRecordedBlob(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: false,
      })
      streamRef.current = stream

      const mimeType =
        ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) =>
          MediaRecorder.isTypeSupported(m),
        ) ?? 'video/webm'

      const mr = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mr

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setRecordedBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        setIsRecording(false)
      }

      // Handle user clicking "Stop sharing" in the browser's native share UI
      stream.getVideoTracks()[0].onended = () => {
        if (mr.state !== 'inactive') mr.stop()
      }

      mr.start(1000)
      setIsRecording(true)
    } catch (err) {
      // NotAllowedError = user cancelled — treat as non-error
      if (err.name !== 'NotAllowedError') {
        setError(err.message ?? 'Could not start recording')
      }
      setIsRecording(false)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const reset = useCallback(() => {
    setRecordedBlob(null)
    setError(null)
  }, [])

  return { isRecording, recordedBlob, error, startRecording, stopRecording, reset }
}
