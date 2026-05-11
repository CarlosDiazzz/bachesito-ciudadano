import { useState, useEffect } from 'react'
import logo from '../assets/logo.png'

export default function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    setShowContent(true)
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(onFinish, 600)
    }, 2500) // allow time to see the pulse
    return () => clearTimeout(timer)
  }, [onFinish])

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-between bg-oaxaca-crema transition-opacity duration-700 ease-in-out ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex-1"></div>

      <div className={`w-full px-4 flex flex-col items-center transition-all duration-1000 transform ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
          <img 
            src={logo} 
            alt="BachesITO Logo" 
            className="w-full h-full object-contain relative z-10"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-end pb-12">
        <div className="flex gap-2 mb-4">
          <div className="w-2.5 h-2.5 bg-oaxaca-guinda rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2.5 h-2.5 bg-oaxaca-guinda rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2.5 h-2.5 bg-oaxaca-guinda rounded-full animate-bounce"></div>
        </div>
        <p className="text-oaxaca-guinda/60 font-bold text-[10px] uppercase tracking-[0.2em]">
          Oaxaca de Juárez
        </p>
      </div>
    </div>
  )
}
