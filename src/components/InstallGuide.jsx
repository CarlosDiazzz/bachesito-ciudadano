import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'bachesito.pwa.guide'

function yaInstalado() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

function detectarPlataforma() {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'otro'
}

const PASOS = {
  ios: [
    {
      num: '1',
      emoji: '🌐',
      titulo: 'Abre esta página en Safari',
      desc: 'La instalación solo funciona desde Safari. Si usas Chrome u otro navegador, cópiala y pégala en Safari.',
    },
    {
      num: '2',
      emoji: '⬆️',
      titulo: 'Toca el botón "Compartir"',
      desc: 'Es el ícono de cuadro con una flecha hacia arriba, en la barra inferior del navegador.',
    },
    {
      num: '3',
      emoji: '📲',
      titulo: 'Selecciona "Agregar a inicio"',
      desc: 'Desplázate hacia abajo en el menú. Busca "Agregar a pantalla de inicio" y tócalo.',
    },
    {
      num: '4',
      emoji: '✅',
      titulo: 'Confirma tocando "Agregar"',
      desc: 'El ícono de BachesITO aparecerá en tu pantalla de inicio como cualquier app.',
    },
  ],
  android: [
    {
      num: '1',
      emoji: '🌐',
      titulo: 'Abre esta página en Chrome',
      desc: 'Asegúrate de usar Google Chrome. Si usas otro navegador, copia la URL y pégala en Chrome.',
    },
    {
      num: '2',
      emoji: '⋮',
      titulo: 'Toca el menú de tres puntos',
      desc: 'El ícono "⋮" está en la esquina superior derecha de Chrome.',
    },
    {
      num: '3',
      emoji: '📥',
      titulo: 'Toca "Instalar app" o "Agregar a pantalla de inicio"',
      desc: 'La opción aparece en el menú desplegable. Algunos dispositivos muestran un banner automático.',
    },
    {
      num: '4',
      emoji: '✅',
      titulo: 'Confirma la instalación',
      desc: 'La app se instalará y aparecerá en tu cajón de aplicaciones y pantalla de inicio.',
    },
  ],
  otro: [
    {
      num: '1',
      emoji: '🌐',
      titulo: 'Abre esta página en Chrome o Edge',
      desc: 'Estos navegadores permiten instalar aplicaciones web en tu dispositivo.',
    },
    {
      num: '2',
      emoji: '⋮',
      titulo: 'Busca la opción de instalación',
      desc: 'En Chrome: menú ⋮ → "Instalar BachesITO". En Edge: menú … → "Aplicaciones" → "Instalar".',
    },
    {
      num: '3',
      emoji: '✅',
      titulo: 'Confirma la instalación',
      desc: 'La app quedará disponible sin necesidad de abrir el navegador.',
    },
  ],
}

export default function InstallGuide() {
  const [visible,        setVisible]        = useState(false)
  const [plataforma,     setPlataforma]     = useState('android')
  const [tabActivo,      setTabActivo]      = useState('android')
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [instalando,     setInstalando]     = useState(false)
  const [animando,       setAnimando]       = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (yaInstalado()) return
    if (localStorage.getItem(STORAGE_KEY) === 'never') return

    const plat = detectarPlataforma()
    setPlataforma(plat)
    setTabActivo(plat === 'ios' ? 'ios' : 'android')

    // Aparece 1.2 s después del splash para no interrumpirlo
    timerRef.current = setTimeout(() => {
      setVisible(true)
      setTimeout(() => setAnimando(true), 10)
    }, 1200)

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      clearTimeout(timerRef.current)
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  function cerrar(parámetro) {
    setAnimando(false)
    setTimeout(() => setVisible(false), 300)
    if (parámetro === 'never') {
      localStorage.setItem(STORAGE_KEY, 'never')
    }
  }

  async function instalarAndroid() {
    if (!deferredPrompt) return
    setInstalando(true)
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEY, 'never')
      cerrar()
    }
    setDeferredPrompt(null)
    setInstalando(false)
  }

  if (!visible) return null

  const pasos = PASOS[tabActivo] ?? PASOS.android

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => cerrar()}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
          transition: 'opacity 0.3s',
          opacity: animando ? 1 : 0,
        }}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
          background: 'white',
          borderRadius: '24px 24px 0 0',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.18)',
          transform: animando ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header guinda */}
        <div style={{ background: 'linear-gradient(135deg, #691332 0%, #9D2449 100%)', padding: '20px 24px 22px' }}>
          <div className="flex items-center gap-3 mb-3">
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, border: '2px solid rgba(255,255,255,0.25)',
            }}>
              🕳️
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 2px' }}>
                Gobierno de Oaxaca de Juárez
              </p>
              <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: 0, lineHeight: 1.2 }}>
                Instala BachesITO
              </h2>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, margin: 0, lineHeight: 1.55 }}>
            Agrega la app a tu pantalla de inicio y reporta baches en segundos, sin abrir el navegador.
          </p>
        </div>

        {/* Tabs iOS / Android */}
        <div className="flex border-b border-gray-100 bg-white sticky top-0 z-10">
          {[
            { id: 'android', emoji: '🤖', label: 'Android' },
            { id: 'ios',     emoji: '🍎', label: 'iPhone / iPad' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTabActivo(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold uppercase tracking-wide transition-colors"
              style={{
                border: 'none', background: 'none', cursor: 'pointer',
                color: tabActivo === t.id ? '#691332' : '#94A3B8',
                borderBottom: tabActivo === t.id ? '2px solid #691332' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <span style={{ fontSize: 16 }}>{t.emoji}</span> {t.label}
              {t.id === plataforma && (
                <span style={{
                  fontSize: 9, fontWeight: 800, background: '#691332', color: 'white',
                  padding: '1px 6px', borderRadius: 99, letterSpacing: 0.5,
                }}>
                  TU DISPOSITIVO
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pasos */}
        <div className="px-6 pt-5 pb-2 space-y-4">
          {pasos.map((paso, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: '#F4F1EA', border: '2px solid #e8e0d5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {paso.emoji}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-bold text-gray-800 mb-0.5 leading-snug">
                  <span style={{ color: '#691332', marginRight: 4 }}>{paso.num}.</span>
                  {paso.titulo}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">{paso.desc}</p>
              </div>
            </div>
          ))}

          {/* Banner de instalación directa en Android si el navegador lo soporta */}
          {tabActivo === 'android' && deferredPrompt && (
            <button
              onClick={instalarAndroid}
              disabled={instalando}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white mt-2 active:scale-95 transition-transform disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #691332, #9D2449)', border: 'none', cursor: 'pointer' }}
            >
              {instalando
                ? <><span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Instalando…</>
                : <>📲 Instalar BachesITO ahora</>
              }
            </button>
          )}
        </div>

        {/* Nota iOS Safari */}
        {tabActivo === 'ios' && (
          <div className="mx-6 mt-2 mb-1 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex gap-2.5 items-start">
            <span className="text-base shrink-0 mt-0.5">ℹ️</span>
            <p className="text-xs text-blue-700 leading-relaxed font-medium">
              Apple solo permite instalar apps web desde <strong>Safari</strong>. Si ves este mensaje en Chrome u otro navegador, copia la URL y ábrela en Safari.
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="px-6 pt-4 pb-8 space-y-3">
          <div className="h-px bg-gray-100" />
          <button
            onClick={() => cerrar()}
            className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold text-sm active:bg-gray-50 transition-colors"
            style={{ cursor: 'pointer', background: 'transparent' }}
          >
            Ahora no
          </button>
          <button
            onClick={() => cerrar('never')}
            className="w-full text-center text-xs text-gray-400 font-medium py-1"
            style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            No volver a mostrar este mensaje
          </button>
        </div>
      </div>
    </>
  )
}
