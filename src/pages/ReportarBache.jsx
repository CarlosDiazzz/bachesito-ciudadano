import { useState, useRef, useEffect } from 'react'
import logo from '../assets/logo.png'
import { getNotificationEnvironment, requestSystemNotificationPermission, sendTestSystemNotification } from '../utils/systemNotifications'

export default function ReportarBache({ initialPhoto = null, onRetake }) {
  const [foto, setFoto] = useState(initialPhoto?.file || null)
  const [preview, setPreview] = useState(initialPhoto?.preview || null)
  const [form, setForm] = useState({ descripcion: '', calle: '', municipio: '', colonia: '' })
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationStatus, setNotificationStatus] = useState(() => {
    if (typeof window === 'undefined') return 'unsupported'
    const env = getNotificationEnvironment()
    if (!env.supported) return 'unsupported'
    if (!env.secure) return 'insecure'
    return env.permission
  })
  const fileRef = useRef()

  useEffect(() => {
    if (initialPhoto) {
      setFoto(initialPhoto.file)
      setPreview(initialPhoto.preview)
    }
  }, [initialPhoto])

  function handleFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setFoto(file)
    setPreview(URL.createObjectURL(file))
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnviando(true)
    if (notificationStatus === 'default') {
      const result = await requestSystemNotificationPermission()
      setNotificationStatus(result.permission)
    }
    await new Promise((r) => setTimeout(r, 1200))
    setEnviado(true)
    setEnviando(false)
  }

  function handleNuevo() {
    setFoto(null)
    setPreview(null)
    setForm({ descripcion: '', calle: '', municipio: '', colonia: '' })
    setEnviado(false)
  }

  async function handleEnableNotifications() {
    const result = await requestSystemNotificationPermission()
    setNotificationStatus(result.permission)
    if (result.permission === 'granted') {
      await sendTestSystemNotification()
      setNotificationMessage('Permiso otorgado y notificación de prueba enviada.')
      return
    }
    if (result.permission === 'denied') {
      setNotificationMessage('El permiso está bloqueado. Debes habilitar notificaciones en configuración del navegador.')
      return
    }
    if (result.permission === 'insecure') {
      setNotificationMessage('Para notificaciones del sistema necesitas abrir la app en HTTPS o localhost.')
      return
    }
    if (result.permission === 'unsupported') {
      setNotificationMessage('Este navegador no soporta notificaciones del sistema.')
      return
    }
    setNotificationMessage('')
  }

  async function handleTestNotification() {
    const sent = await sendTestSystemNotification()
    setNotificationMessage(sent ? 'Notificación de prueba enviada.' : 'No se pudo enviar la notificación de prueba.')
  }

  const municipios = [
    'Oaxaca de Juárez',
    'San Juan Bautista Tuxtepec',
    'Juchitán de Zaragoza',
    'Salina Cruz',
    'Tehuantepec',
    'Miahuatlán de Porfirio Díaz',
    'Huajuapan de León',
    'Tlaxiaco',
    'Pochutla',
    'Loma Bonita',
  ]

  if (enviado) {
    return (
      <div className="min-h-screen bg-oaxaca-crema flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center border-t-4 border-oaxaca-guinda">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Reporte enviado</h2>
          <p className="text-gray-500 mb-6">Gracias por tu reporte. Las autoridades correspondientes lo atenderán.</p>
          {notificationStatus !== 'granted' && (
            <button
              onClick={handleEnableNotifications}
              className="w-full mb-3 border border-oaxaca-guinda text-oaxaca-guinda font-semibold py-3 rounded-xl transition-colors hover:bg-oaxaca-guinda/5"
            >
              Activar notificaciones del sistema
            </button>
          )}
          {notificationStatus === 'granted' && (
            <>
              <p className="text-green-700 text-sm mb-3">Notificaciones activadas. Te avisaremos cuando tu reporte sea atendido.</p>
              <button
                onClick={handleTestNotification}
                className="w-full mb-3 border border-green-600 text-green-700 font-semibold py-3 rounded-xl transition-colors hover:bg-green-50"
              >
                Enviar notificación de prueba
              </button>
            </>
          )}
          {notificationMessage && <p className="text-xs text-gray-600 mb-3">{notificationMessage}</p>}
          <button
            onClick={handleNuevo}
            className="w-full bg-oaxaca-guinda hover:bg-oaxaca-guinda-dark text-white font-semibold py-3 rounded-xl transition-colors shadow-lg"
          >
            Reportar otro bache
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-oaxaca-crema flex flex-col">
      {/* Header Extra Compacto - Greca Gigante */}
      <header className="bg-white text-gray-800 px-4 py-1 shadow-md relative overflow-hidden border-b-4 border-oaxaca-oro">
        {/* Greca Pattern Background - Even Larger */}
        <div className="absolute top-0 left-0 w-full h-10 bg-greca opacity-80"></div>
        <div className="absolute bottom-0 left-0 w-full h-10 bg-greca rotate-180 opacity-80"></div>
        
        <div className="max-w-lg mx-auto flex items-center justify-center gap-8 relative z-10 px-4 mt-4 mb-3">
          <div className="w-28 h-28 flex items-center justify-center transform hover:scale-105 transition-transform duration-500">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="h-16 w-[1px] bg-oaxaca-oro/30"></div>
          <div className="flex flex-col items-start text-left">
            <p className="text-oaxaca-oro text-[15px] font-black uppercase tracking-[0.4em] leading-tight">Atención</p>
            <p className="text-oaxaca-oro text-[15px] font-black uppercase tracking-[0.4em] leading-tight mb-1">Ciudadana</p>
            <div className="h-[2px] w-14 bg-oaxaca-guinda/20"></div>
            <p className="text-oaxaca-guinda/40 text-[9px] font-bold uppercase tracking-[0.2em] mt-2">Gobierno de Oaxaca</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto px-4 py-6 space-y-5 w-full">

        {/* Foto */}
        <section className="bg-white rounded-2xl shadow-md p-5 border border-oaxaca-crema-dark">
          <h2 className="font-bold text-oaxaca-guinda mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-oaxaca-guinda text-white rounded-md flex items-center justify-center text-xs font-bold">1</span>
            Evidencia Fotográfica
          </h2>

          {preview ? (
            <div className="relative rounded-xl overflow-hidden shadow-inner border border-gray-100">
              <img src={preview} alt="Foto del bache" className="w-full h-56 object-cover" />
              <button
                type="button"
                onClick={() => { setFoto(null); setPreview(null) }}
                className="absolute top-2 right-2 bg-oaxaca-guinda/80 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-oaxaca-guinda transition-colors backdrop-blur-sm"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onRetake}
                className="flex-1 h-44 border-2 border-dashed border-oaxaca-oro/30 rounded-xl flex flex-col items-center justify-center gap-3 text-oaxaca-oro hover:bg-oaxaca-crema transition-colors group"
              >
                <div className="w-14 h-14 bg-white shadow-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-oaxaca-guinda" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-oaxaca-guinda/70">Capturar de nuevo</span>
              </button>

              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="w-24 h-44 rounded-xl bg-white border border-oaxaca-crema-dark flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all group"
                title="Elegir desde galería"
              >
                <div className="w-10 h-10 bg-oaxaca-crema rounded-full flex items-center justify-center group-hover:bg-oaxaca-oro/10 transition-colors">
                  <svg className="w-6 h-6 text-oaxaca-oro" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l4-4h10l4 4" />
                  </svg>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-tighter text-oaxaca-oro">Galería</span>
              </button>
            </div>
          )}
          <input ref={fileRef} id="file-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
        </section>

        {/* Ubicación */}
        <section className="bg-white rounded-2xl shadow-md p-5 border border-oaxaca-crema-dark">
          <h2 className="font-bold text-oaxaca-guinda mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-oaxaca-guinda text-white rounded-md flex items-center justify-center text-xs font-bold">2</span>
            Ubicación del Incidente
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Municipio *</label>
              <select
                name="municipio"
                value={form.municipio}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-oaxaca-oro/50 bg-gray-50/50"
              >
                <option value="">Seleccione municipio</option>
                {municipios.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Colonia / Barrio</label>
                <input
                  type="text"
                  name="colonia"
                  value={form.colonia}
                  onChange={handleChange}
                  placeholder="Ej. Centro"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-oaxaca-oro/50 bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Calle y Referencia *</label>
                <input
                  type="text"
                  name="calle"
                  value={form.calle}
                  onChange={handleChange}
                  required
                  placeholder="Calle y número aprox."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-oaxaca-oro/50 bg-gray-50/50"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Descripción */}
        <section className="bg-white rounded-2xl shadow-md p-5 border border-oaxaca-crema-dark">
          <h2 className="font-bold text-oaxaca-guinda mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-oaxaca-guinda text-white rounded-md flex items-center justify-center text-xs font-bold">3</span>
            Detalles Adicionales
          </h2>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            rows={3}
            placeholder="Describa brevemente el estado del bache..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-oaxaca-oro/50 bg-gray-50/50 resize-none"
          />
        </section>

        {/* Botón enviar */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!form.municipio || !form.calle || enviando}
            className="w-full bg-oaxaca-guinda hover:bg-oaxaca-guinda-dark disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl text-base uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
          >
            {enviando ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Enviando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Enviar Reporte
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer Estilo Oaxaqueño Compacto */}
      <footer className="bg-[#f0f0f0] border-t-8 border-oaxaca-oro pt-8 pb-6 px-6 mt-6">
        <div className="max-w-lg mx-auto grid grid-cols-1 gap-6">
          {/* Branding */}
          <div className="flex items-center gap-4">
            <img src={logo} alt="Logo" className="w-16 opacity-30 grayscale contrast-125" />
            <div>
              <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                Sistema de Reporte Ciudadano<br/>
                Atención Colectivo Metropolitano
              </p>
            </div>
          </div>

          {/* Emergency & Social */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col justify-center">
              <p className="text-oaxaca-guinda text-2xl font-black italic tracking-tighter">911</p>
              <p className="text-gray-400 text-[8px] font-bold uppercase tracking-widest mt-1">Emergencias</p>
            </div>

            <div className="flex items-center justify-around bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <a href="#" className="text-gray-400 hover:text-oaxaca-guinda transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-oaxaca-guinda transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-oaxaca-guinda transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="border-t border-gray-200 pt-6 flex justify-center">
            <a href="#" className="text-gray-400 text-[9px] font-bold uppercase tracking-widest hover:text-oaxaca-oro transition-colors">Política de Privacidad</a>
          </div>

          <p className="text-center text-[9px] text-gray-300 font-bold uppercase tracking-[0.4em] pt-2">
            Gobierno del Estado de Oaxaca
          </p>
        </div>
      </footer>
    </div>
  )
}
