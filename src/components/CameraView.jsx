import { useState, useRef, useEffect, useCallback } from 'react'

export default function CameraView({ onCapture, onCancel }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const streamRef = useRef(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [error, setError] = useState(null)
  const [isStarting, setIsStarting] = useState(true)

  const stopCamera = useCallback(() => {
    if (!streamRef.current) return
    streamRef.current.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setIsStarting(true)
    setError(null)

    const legacyGetUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
    const getUserMedia = navigator.mediaDevices?.getUserMedia
      ? (constraints) => navigator.mediaDevices.getUserMedia(constraints)
      : legacyGetUserMedia
        ? (constraints) => new Promise((resolve, reject) => legacyGetUserMedia.call(navigator, constraints, resolve, reject))
        : null

    if (!getUserMedia) {
      const insecureContext = !window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)
      setError(
        insecureContext
          ? 'No se puede abrir la cámara en este sitio porque no es seguro (HTTPS). Usa https:// o localhost.'
          : 'Tu navegador no permite abrir la cámara web. Puedes usar la cámara del dispositivo desde el botón de abajo.'
      )
      setIsStarting(false)
      return
    }

    stopCamera()

    const attempts = [
      { video: { facingMode: { ideal: facingMode } }, audio: false },
      { video: true, audio: false },
    ]

    let lastError = null

    for (const constraints of attempts) {
      try {
        const newStream = await getUserMedia(constraints)
        streamRef.current = newStream
        if (videoRef.current) {
          videoRef.current.srcObject = newStream
          await videoRef.current.play().catch(() => {})
        }
        setIsStarting(false)
        return
      } catch (err) {
        lastError = err
        if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
          break
        }
      }
    }

    console.error('Error accessing camera:', lastError)
    try {
      const permission = await navigator.permissions?.query?.({ name: 'camera' })
      if (permission?.state === 'denied') {
        setError('Bloqueaste el permiso de cámara. Actívalo en la configuración del navegador.')
      } else if (lastError?.name === 'NotFoundError' || lastError?.name === 'OverconstrainedError') {
        setError('No se encontró una cámara disponible en este dispositivo. Puedes seleccionar una imagen de la galería.')
      } else {
        setError('No se pudo abrir la cámara. Intenta de nuevo o selecciona una imagen de la galería.')
      }
    } catch {
      setError('No se pudo abrir la cámara. Intenta de nuevo o selecciona una imagen de la galería.')
    }
    setIsStarting(false)
  }, [facingMode, stopCamera])

  useEffect(() => {
    // Needed: initialize camera stream on mount/facing change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCamera()
    return stopCamera
  }, [startCamera, stopCamera])

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current || !videoRef.current.videoWidth || !videoRef.current.videoHeight) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" })
      onCapture(file, URL.createObjectURL(blob))
    }, 'image/jpeg', 0.8)
  }

  function handleGallery(e) {
    const file = e.target.files[0]
    if (!file) return
    onCapture(file, URL.createObjectURL(file))
  }

  function toggleCamera() {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center overflow-hidden">
      {isStarting ? (
        <div className="text-white text-center p-6">
          <p className="mb-2">Abriendo cámara…</p>
          <p className="text-sm text-white/70">Si tarda, revisa permisos del navegador.</p>
        </div>
      ) : error ? (
        <div className="text-white text-center p-6">
          <p className="mb-4">{error}</p>
          <div className="flex flex-col items-center gap-3">
            <button onClick={startCamera} className="bg-white/15 border border-white/20 px-6 py-3 rounded-xl font-bold uppercase tracking-widest">
              Reintentar cámara
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-oaxaca-guinda px-6 py-3 rounded-xl font-bold uppercase tracking-widest">
              Abrir cámara/galería
            </button>
          </div>
        </div>
      ) : (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
        <div className="flex justify-between items-start pointer-events-auto">
          <button onClick={onCancel} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white">
            ✕
          </button>
          <button onClick={toggleCamera} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-center gap-12 pointer-events-auto">
          <div className="flex-1"></div> {/* Spacer */}
          
          <button 
            onClick={capturePhoto}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 group active:scale-95 transition-transform"
          >
            <div className="w-full h-full bg-white rounded-full group-active:bg-gray-200"></div>
          </button>

          <div className="flex-1 flex justify-end">
            <button 
              onClick={() => fileInputRef.current.click()}
              className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/30 text-white active:scale-90 transition-transform"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.582a2 2 0 012.828 0L16 16m-2-2l1.586-1.582a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        onChange={handleGallery}
      />
    </div>
  )
}
