import { useState, useRef } from 'react'

export default function ReportarBache() {
  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState({ descripcion: '', calle: '', municipio: '', colonia: '' })
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const fileRef = useRef()

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
    // TODO: conectar con API Laravel
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
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Reporte enviado</h2>
          <p className="text-gray-500 mb-6">Gracias por tu reporte. Las autoridades municipales lo atenderán a la brevedad.</p>
          <button
            onClick={handleNuevo}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Reportar otro bache
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <header className="bg-orange-500 text-white px-4 py-4 shadow-md">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">BachesITO Ciudadano</h1>
            <p className="text-orange-100 text-xs">Oaxaca — Reporta un bache</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Foto */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
            Foto del bache
          </h2>

          {preview ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={preview} alt="Foto del bache" className="w-full h-52 object-cover" />
              <button
                type="button"
                onClick={() => { setFoto(null); setPreview(null) }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              className="w-full h-40 border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center gap-2 text-orange-400 hover:bg-orange-50 transition-colors"
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Tomar foto o seleccionar</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
        </section>

        {/* Ubicación */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
            Ubicación
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Municipio *</label>
              <select
                name="municipio"
                value={form.municipio}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                <option value="">Selecciona un municipio</option>
                {municipios.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Colonia / Barrio</label>
              <input
                type="text"
                name="colonia"
                value={form.colonia}
                onChange={handleChange}
                placeholder="Ej. Centro, Jalatlaco..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Calle / Referencia *</label>
              <input
                type="text"
                name="calle"
                value={form.calle}
                onChange={handleChange}
                required
                placeholder="Ej. Av. Juárez entre Morelos y 5 de Mayo"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
        </section>

        {/* Descripción */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
            Descripción
          </h2>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            rows={3}
            placeholder="Describe el bache: tamaño, profundidad, si ya causó accidentes..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </section>

        {/* Botón enviar */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!form.municipio || !form.calle || enviando}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white font-bold py-4 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2 shadow-md"
        >
          {enviando ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Enviando reporte...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Enviar reporte
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          Tu reporte es anónimo y será atendido por el municipio correspondiente.
        </p>
      </main>
    </div>
  )
}
