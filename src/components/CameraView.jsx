import { useState, useRef, useEffect } from 'react'

export default function CameraView({ onCapture, onCancel }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [error, setError] = useState(null)

  useEffect(() => {
    startCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [facingMode])

  async function startCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false
      })
      setStream(newStream)
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("No se pudo acceder a la cámara. Por favor verifica los permisos.")
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    canvas.toBlob((blob) => {
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
      {error ? (
        <div className="text-white text-center p-6">
          <p className="mb-4">{error}</p>
          <button onClick={() => fileInputRef.current.click()} className="bg-oaxaca-guinda px-6 py-3 rounded-xl font-bold uppercase tracking-widest">
            Elegir de Galería
          </button>
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
        className="hidden" 
        onChange={handleGallery}
      />
    </div>
  )
}
