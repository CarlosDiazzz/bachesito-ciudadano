import { useState, useRef, useEffect } from 'react'
import logo from '../assets/logo.png'

export default function ReportarBache({ autoOpenCamera = false }) {
  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState({ descripcion: '', calle: '', municipio: '', colonia: '' })
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    if (autoOpenCamera && fileRef.current) {
      // trigger camera prompt
      fileRef.current.click()
    }
  }, [autoOpenCamera])

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
    <div className="min-h-screen bg-oaxaca-crema pb-10">
      {/* Header Estilo Gobierno */}
      <header className="bg-oaxaca-guinda text-white px-4 py-4 shadow-lg border-b-2 border-oaxaca-oro">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1 shadow-inner">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold leading-tight uppercase tracking-tight">BachesITO</h1>
            <p className="text-oaxaca-oro text-[10px] font-bold uppercase tracking-widest">Atención Ciudadana Oaxaca</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">

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
                onClick={() => fileRef.current.click()}
                className="flex-1 h-44 border-2 border-dashed border-oaxaca-oro/30 rounded-xl flex flex-col items-center justify-center gap-3 text-oaxaca-oro hover:bg-oaxaca-crema transition-colors"
              >
                <div className="w-12 h-12 bg-oaxaca-crema rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-oaxaca-guinda" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm font-bold uppercase tracking-wide">Capturar Bache</span>
              </button>

              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="w-20 h-44 rounded-xl bg-white border border-oaxaca-crema-dark flex items-center justify-center shadow-md"
                title="Elegir desde galería"
              >
                <svg className="w-6 h-6 text-oaxaca-oro" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l4-4h10l4 4" />
                </svg>
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

        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest pb-6">
          Gobierno del Estado de Oaxaca
        </p>
      </main>
    </div>
  )
}
