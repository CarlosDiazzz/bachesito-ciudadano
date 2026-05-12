import { useState, useRef, useEffect, useCallback } from 'react'
import logo from '../assets/logo.png'
import { requestSystemNotificationPermission, showSystemNotification } from '../utils/systemNotifications'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8001/api'

const SEV_COLOR  = { alta: '#9D2449', media: '#B7791F', baja: '#276749' }
const SEV_BG     = { alta: '#FFF5F5', media: '#FFFAF0', baja: '#F0FFF4' }
const SEV_BORDER = { alta: '#FEB2B2', media: '#F6E05E', baja: '#9AE6B4' }
const SEV_EMOJI  = { alta: '🔴', media: '🟡', baja: '🟢' }

// ── Helpers EXIF ─────────────────────────────────────────────────────────────
function readExif(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const buf  = e.target.result
        const view = new DataView(buf)
        if (view.getUint16(0) !== 0xFFD8) { resolve(null); return }

        let offset = 2
        while (offset < view.byteLength - 2) {
          const marker = view.getUint16(offset)
          if (marker === 0xFFE1) { // APP1 = EXIF
            const exifOffset = offset + 10
            const isBigEndian = view.getUint16(exifOffset) === 0x4D4D
            const getU16 = o => isBigEndian ? view.getUint16(exifOffset + o) : view.getUint16(exifOffset + o, true)
            const getU32 = o => isBigEndian ? view.getUint32(exifOffset + o) : view.getUint32(exifOffset + o, true)
            const getR   = o => { const n = getU32(o); const d = getU32(o + 4); return d ? n / d : 0 }

            let ifd = getU32(4)
            const nEntries = getU16(ifd)
            let gpsIfd = null

            for (let i = 0; i < nEntries; i++) {
              const tag = getU16(ifd + 2 + i * 12)
              if (tag === 0x8825) gpsIfd = getU32(ifd + 2 + i * 12 + 8)
            }

            if (!gpsIfd) { resolve(null); return }

            const nGps = getU16(gpsIfd)
            let latRef, latDMS, lngRef, lngDMS

            for (let i = 0; i < nGps; i++) {
              const base  = gpsIfd + 2 + i * 12
              const tag   = getU16(base)
              const count = getU32(base + 4)
              const vOff  = getU32(base + 8)

              if (tag === 1) latRef = String.fromCharCode(view.getUint8(exifOffset + base - gpsIfd + 8 + gpsIfd - gpsIfd))
              if (tag === 2 && count === 3) latDMS  = [getR(vOff), getR(vOff + 8), getR(vOff + 16)]
              if (tag === 3) lngRef = String.fromCharCode(view.getUint8(exifOffset + base - gpsIfd + 8 + gpsIfd - gpsIfd))
              if (tag === 4 && count === 3) lngDMS  = [getR(vOff), getR(vOff + 8), getR(vOff + 16)]
            }

            if (latDMS && lngDMS) {
              const toDecimal = (dms, ref) => {
                const val = dms[0] + dms[1] / 60 + dms[2] / 3600
                return (ref === 'S' || ref === 'W') ? -val : val
              }
              resolve({ lat: toDecimal(latDMS, latRef), lng: toDecimal(lngDMS, lngRef) })
              return
            }
            resolve(null); return
          }
          if ((marker & 0xFF00) !== 0xFF00) break
          offset += 2 + view.getUint16(offset + 2)
        }
        resolve(null)
      } catch { resolve(null) }
    }
    reader.readAsArrayBuffer(file)
  })
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=es`,
      { headers: { 'User-Agent': 'BachesITO/1.0' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const a = data.address ?? {}
    return {
      calle:    a.road ?? a.pedestrian ?? a.footway ?? '',
      colonia:  a.suburb ?? a.neighbourhood ?? a.quarter ?? a.village ?? '',
      municipio:a.city ?? a.town ?? a.municipality ?? a.county ?? '',
      estado:   a.state ?? '',
      display:  data.display_name ?? '',
    }
  } catch { return null }
}

// ── Mini mapa de pin ──────────────────────────────────────────────────────────
function PinMap({ lat, lng, onChange }) {
  const ref  = useRef(null)
  const mapR = useRef(null)
  const mkR  = useRef(null)

  useEffect(() => {
    if (!ref.current || !window.L) return
    if (mapR.current) { mapR.current.remove(); mapR.current = null }

    const L   = window.L
    const map = L.map(ref.current, { center: [lat, lng], zoom: 17, zoomControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map)

    const pinIcon = L.divIcon({
      className: '',
      html: `<div style="
        width:36px;height:36px;border-radius:50% 50% 50% 0;
        background:#9D2449;border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        transform:rotate(-45deg);
      "></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    })
    const mk = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(map)
    mk.on('dragend', e => {
      const { lat: la, lng: lo } = e.target.getLatLng()
      onChange(la, lo)
    })
    map.on('click', e => {
      mk.setLatLng(e.latlng)
      onChange(e.latlng.lat, e.latlng.lng)
    })

    mapR.current = map
    mkR.current  = mk
    return () => { map.remove(); mapR.current = null }
  }, [])

  useEffect(() => {
    if (!mapR.current || !mkR.current) return
    mkR.current.setLatLng([lat, lng])
    mapR.current.setView([lat, lng], mapR.current.getZoom())
  }, [lat, lng])

  return <div ref={ref} style={{ height: '200px', width: '100%', zIndex: 0 }} className="rounded-xl overflow-hidden border border-gray-200" />
}

// ── Tarjeta IA ────────────────────────────────────────────────────────────────
function AiCard({ estado, resultado, error }) {
  if (estado === 'cargando') return (
    <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-200 p-5 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full border-[3px] border-oaxaca-guinda border-t-transparent animate-spin shrink-0" />
      <div>
        <p className="font-bold text-oaxaca-guinda text-sm">Verificando la foto…</p>
        <p className="text-xs text-gray-400 mt-0.5">Esto solo tarda un momento</p>
      </div>
    </div>
  )
  if (estado === 'error') return (
    <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3 items-start">
      <span className="text-xl mt-0.5">⚠️</span>
      <div>
        <p className="font-bold text-amber-700 text-sm">No se pudo verificar la imagen</p>
        <p className="text-xs text-gray-500 mt-1">
          Completa los datos de ubicación y descripción del bache abajo para continuar.
        </p>
      </div>
    </div>
  )
  if (estado === 'no-bache') return (
    <div className="mt-4 rounded-2xl bg-red-50 border border-red-300 p-4">
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xl">❌</div>
        <div>
          <p className="font-bold text-red-700">No se pudo identificar un bache</p>
          <p className="text-sm text-red-600 mt-1">Asegúrate de que la foto muestre claramente el daño en la vía.</p>
        </div>
      </div>
      <p className="mt-3 bg-red-100 rounded-xl p-3 text-xs text-red-700 font-medium">
        📷 Toma la foto de frente al bache, con buena luz.
      </p>
    </div>
  )
  if (estado === 'bache') {
    const sev = resultado.severidad_ia
    return (
      <div className="mt-4 rounded-2xl overflow-hidden border" style={{ borderColor: SEV_BORDER[sev] ?? '#CBD5E0' }}>
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: SEV_BG[sev] ?? '#EDF2F7' }}>
          <span className="text-2xl">{SEV_EMOJI[sev] ?? '🔵'}</span>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: SEV_COLOR[sev] }}>✅ Bache detectado</p>
            <p className="text-xs text-gray-500">Nivel de daño registrado</p>
          </div>
          <span className="text-xs font-black text-white px-3 py-1 rounded-full capitalize" style={{ background: SEV_COLOR[sev] }}>
            {sev}
          </span>
        </div>
        <div className="grid grid-cols-3 text-center divide-x bg-gray-50">
          {[
            { icon: '📏', label: 'Profundidad', val: resultado.profundidad_estimada_cm ? `${resultado.profundidad_estimada_cm}cm` : '—' },
            { icon: '📐', label: 'Área',        val: resultado.area_estimada_m2        ? `${resultado.area_estimada_m2}m²`        : '—' },
            { icon: '⚠️',  label: 'Severidad',  val: sev ? sev.charAt(0).toUpperCase() + sev.slice(1) : '—' },
          ].map(({ icon, label, val }) => (
            <div key={label} className="py-3 px-1">
              <div className="text-base">{icon}</div>
              <div className="font-black text-sm mt-0.5" style={{ color: SEV_COLOR[sev] }}>{val}</div>
              <div className="text-[9px] text-gray-400 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
        {resultado.razon && (
          <div className="px-4 py-3 bg-white text-xs text-gray-600 leading-relaxed border-t" style={{ borderColor: SEV_BORDER[sev] }}>
            {resultado.razon}
          </div>
        )}
      </div>
    )
  }
  return null
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ReportarBache({ initialPhoto = null, onRetake }) {
  const [foto,      setFoto]      = useState(initialPhoto?.file    || null)
  const [preview,   setPreview]   = useState(initialPhoto?.preview || null)
  const [aiEstado,  setAiEstado]  = useState(null)
  const [aiResult,  setAiResult]  = useState(null)
  const [aiError,   setAiError]   = useState(null)

  // Ubicación
  const [locEstado, setLocEstado] = useState(null) // null | detectando | exif | gps | manual | fallo
  const [lat,       setLat]       = useState(null)
  const [lng,       setLng]       = useState(null)

  // Campos del form
  const [calle,     setCalle]     = useState('')
  const [colonia,   setColonia]   = useState('')
  const [municipio, setMunicipio] = useState('')
  const [desc,      setDesc]      = useState('')

  const [enviando,  setEnviando]  = useState(false)
  const [enviado,   setEnviado]   = useState(false)
  const [folio,     setFolio]     = useState(null)
  const [errorEnvio,setErrorEnvio]= useState(null)

  const fileRef = useRef()

  const formularioHabilitado = aiEstado === 'bache' || aiEstado === 'error'
  const tieneUbicacion       = lat !== null && lng !== null
  const puedeEnviar          = formularioHabilitado && tieneUbicacion && !enviando

  // ── Al llegar foto desde cámara, procesarla ───────────────────────────────
  useEffect(() => {
    if (initialPhoto?.file) procesarFoto(initialPhoto.file, initialPhoto.preview)
  }, [])

  async function procesarFoto(file, previewUrl) {
    setFoto(file)
    setPreview(previewUrl ?? URL.createObjectURL(file))
    setAiEstado('cargando')
    setAiResult(null); setAiError(null)

    // Lanzar IA y EXIF en paralelo
    const [, exif] = await Promise.all([
      analizarConIA(file),
      readExif(file),
    ])

    if (exif?.lat && exif?.lng && Math.abs(exif.lat) > 0.001) {
      await aplicarCoordenadas(exif.lat, exif.lng, 'exif')
    } else {
      pedirGPS()
    }
  }

  async function analizarConIA(file) {
    const fd = new FormData()
    fd.append('foto', file)
    try {
      const res  = await fetch(`${API_BASE}/ai/preanalizar`, { method: 'POST', headers: { Accept: 'application/json' }, body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message ?? 'Error del servidor')
      setAiResult(data)
      setAiEstado(data.es_bache ? 'bache' : 'no-bache')
    } catch (e) {
      setAiError(e.message)
      setAiEstado('error')
    }
  }

  async function aplicarCoordenadas(la, lo, fuente) {
    setLat(la); setLng(lo)
    setLocEstado(fuente)
    const geo = await reverseGeocode(la, lo)
    if (geo) {
      if (geo.calle    && !calle)     setCalle(geo.calle)
      if (geo.colonia  && !colonia)   setColonia(geo.colonia)
      if (geo.municipio && !municipio) setMunicipio(geo.municipio)
    }
  }

  function pedirGPS() {
    setLocEstado('detectando')
    if (!navigator.geolocation) { setLocEstado('fallo'); return }
    navigator.geolocation.getCurrentPosition(
      pos => aplicarCoordenadas(pos.coords.latitude, pos.coords.longitude, 'gps'),
      ()  => setLocEstado('fallo'),
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  const handleMapChange = useCallback(async (la, lo) => {
    setLat(la); setLng(lo)
    setLocEstado('manual')
    const geo = await reverseGeocode(la, lo)
    if (geo) {
      setCalle(geo.calle || calle)
      setColonia(geo.colonia || colonia)
      setMunicipio(geo.municipio || municipio)
    }
  }, [calle, colonia, municipio])

  function handleFileInput(e) {
    const file = e.target.files[0]
    if (file) procesarFoto(file, null)
  }

  function quitarFoto() {
    setFoto(null); setPreview(null)
    setAiEstado(null); setAiResult(null); setAiError(null)
    setLat(null); setLng(null); setLocEstado(null)
    setCalle(''); setColonia(''); setMunicipio('')
  }

  async function handleSubmit() {
    if (!puedeEnviar) return
    setEnviando(true); setErrorEnvio(null)

    const fd = new FormData()
    fd.append('latitud',  lat)
    fd.append('longitud', lng)
    fd.append('nombre_via', calle || 'Sin nombre')
    fd.append('descripcion', desc)
    fd.append('direccion_aproximada', [calle, colonia, municipio].filter(Boolean).join(', '))
    fd.append('location_source', locEstado ?? 'manual')
    if (foto) fd.append('foto', foto)

    try {
      const res  = await fetch(`${API_BASE}/reportes/ciudadano`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`)
      setFolio(data.folio)
      setEnviado(true)
      // Pedir permiso y notificar si el navegador lo soporta
      await requestSystemNotificationPermission()
      await showSystemNotification({
        title: 'Reporte enviado',
        body: `Tu reporte ${data.folio ?? ''} fue recibido. Te notificaremos cuando sea atendido.`,
        tag: `reporte-enviado-${data.id}`,
        data: { reporteId: data.id },
      })
    } catch (e) {
      setErrorEnvio(e.message)
    } finally {
      setEnviando(false)
    }
  }

  function handleNuevo() {
    setFoto(null); setPreview(null); setAiEstado(null); setAiResult(null); setAiError(null)
    setLat(null); setLng(null); setLocEstado(null)
    setCalle(''); setColonia(''); setMunicipio(''); setDesc('')
    setEnviado(false); setFolio(null); setErrorEnvio(null)
  }

  // ── Pantalla de éxito ────────────────────────────────────────────────────
  if (enviado) return (
    <div className="min-h-screen bg-oaxaca-crema flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center border-t-4 border-oaxaca-guinda">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">¡Reporte enviado!</h2>
        {folio && <p className="text-xs font-mono text-oaxaca-guinda mb-3 bg-oaxaca-crema px-3 py-1 rounded-full inline-block">{folio}</p>}
        {aiResult?.severidad_ia && (
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
            style={{ background: SEV_BG[aiResult.severidad_ia], color: SEV_COLOR[aiResult.severidad_ia], border: `1px solid ${SEV_BORDER[aiResult.severidad_ia]}` }}>
            {SEV_EMOJI[aiResult.severidad_ia]} Severidad {aiResult.severidad_ia} registrada
          </div>
        )}
        <p className="text-gray-500 mb-6">Gracias por tu reporte. Las autoridades lo atenderán a la brevedad.</p>
        <button onClick={handleNuevo}
          className="w-full bg-oaxaca-guinda text-white font-semibold py-3 rounded-xl shadow-lg active:scale-95 transition-transform">
          Reportar otro bache
        </button>
      </div>
    </div>
  )

  // ── Formulario ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-oaxaca-crema flex flex-col">
      {/* Header */}
      <header className="bg-white text-gray-800 px-4 py-1 shadow-md relative overflow-hidden border-b-4 border-oaxaca-oro">
        <div className="absolute top-0 left-0 w-full h-10 bg-greca opacity-80" />
        <div className="absolute bottom-0 left-0 w-full h-10 bg-greca rotate-180 opacity-80" />
        <div className="max-w-lg mx-auto flex items-center justify-center gap-8 relative z-10 px-4 mt-4 mb-3">
          <div className="w-28 h-28 flex items-center justify-center">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="h-16 w-[1px] bg-oaxaca-oro/30" />
          <div className="flex flex-col items-start text-left">
            <p className="text-oaxaca-oro text-[15px] font-black uppercase tracking-[0.4em] leading-tight">Atención</p>
            <p className="text-oaxaca-oro text-[15px] font-black uppercase tracking-[0.4em] leading-tight mb-1">Ciudadana</p>
            <div className="h-[2px] w-14 bg-oaxaca-guinda/20" />
            <p className="text-oaxaca-guinda/40 text-[9px] font-bold uppercase tracking-[0.2em] mt-2">Gobierno de Oaxaca</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto px-4 py-6 space-y-5 w-full pb-28">

        {/* ── Paso 1: Foto ── */}
        <section className="bg-white rounded-2xl shadow-md p-5 border border-oaxaca-crema-dark">
          <h2 className="font-bold text-oaxaca-guinda mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-oaxaca-guinda text-white rounded-md flex items-center justify-center text-xs font-bold">1</span>
            Evidencia Fotográfica
            {aiEstado === 'bache' && <span className="ml-auto text-xs text-green-600 font-semibold">✓ Validada</span>}
          </h2>

          {preview ? (
            <>
              <div className="relative rounded-xl overflow-hidden border border-gray-100">
                <img src={preview} alt="Foto del bache" className="w-full h-52 object-cover block" />
                <button type="button" onClick={quitarFoto}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-lg px-3 py-1 text-xs font-bold active:scale-95 transition-transform">
                  ✕ Cambiar foto
                </button>
              </div>
              <AiCard estado={aiEstado} resultado={aiResult} error={aiError} />
              {aiEstado === 'no-bache' && (
                <button type="button" onClick={onRetake}
                  className="mt-3 w-full py-3 rounded-xl border-2 border-oaxaca-guinda text-oaxaca-guinda font-bold text-sm active:scale-95 transition-transform">
                  📷 Tomar otra foto
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400 text-center mb-4">Se verificará si la imagen muestra un bache real</p>
              <div className="flex gap-3">
                <button type="button" onClick={onRetake}
                  className="flex-1 h-44 border-2 border-dashed border-oaxaca-guinda/40 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-oaxaca-crema active:scale-95 transition-all group">
                  <div className="w-14 h-14 bg-white shadow-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-oaxaca-guinda" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-oaxaca-guinda/80">Tomar foto</span>
                </button>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-28 h-44 rounded-xl bg-white border border-oaxaca-crema-dark flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all group">
                  <div className="w-10 h-10 bg-oaxaca-crema rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-oaxaca-oro" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-tighter text-oaxaca-oro">Galería</span>
                </button>
              </div>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
        </section>

        {/* ── Paso 2: Ubicación (solo si IA validó) ── */}
        {formularioHabilitado && (
          <section className="bg-white rounded-2xl shadow-md p-5 border border-oaxaca-crema-dark space-y-4">
            <h2 className="font-bold text-oaxaca-guinda flex items-center gap-2">
              <span className="w-6 h-6 bg-oaxaca-guinda text-white rounded-md flex items-center justify-center text-xs font-bold">2</span>
              Ubicación del Bache
              {tieneUbicacion && <span className="ml-auto text-xs text-green-600 font-semibold">✓ Ubicación lista</span>}
            </h2>

            {/* Estado de detección */}
            {locEstado === 'detectando' && (
              <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
                <p className="text-xs text-blue-700 font-medium">Detectando ubicación…</p>
              </div>
            )}
            {locEstado === 'exif' && (
              <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3 border border-green-200 text-xs text-green-700 font-medium">
                <span>📍</span> Ubicación detectada automáticamente desde la foto
              </div>
            )}
            {locEstado === 'gps' && (
              <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3 border border-green-200 text-xs text-green-700 font-medium">
                <span>📡</span> Ubicación obtenida por GPS del dispositivo
              </div>
            )}
            {locEstado === 'manual' && (
              <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-700 font-medium">
                <span>📌</span> Ubicación marcada manualmente
              </div>
            )}
            {locEstado === 'fallo' && !tieneUbicacion && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-700">
                <p className="font-bold mb-1">No se pudo detectar la ubicación automáticamente</p>
                <p>Toca el mapa para marcar dónde está el bache.</p>
              </div>
            )}

            {/* Mapa de confirmación / selección */}
            {tieneUbicacion ? (
              <>
                <p className="text-xs text-gray-400">Arrastra el pin o toca el mapa para ajustar la ubicación exacta</p>
                <PinMap lat={lat} lng={lng} onChange={handleMapChange} />
                <p className="text-[10px] text-gray-400 text-center font-mono">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </p>
              </>
            ) : locEstado !== 'detectando' ? (
              <>
                <p className="text-xs text-gray-400">Toca el mapa para marcar la ubicación del bache</p>
                <PinMap lat={17.0665} lng={-96.7213} onChange={handleMapChange} />
              </>
            ) : null}

            {/* Campos autocompletados / editables */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Calle o Avenida</label>
                <input value={calle} onChange={e => setCalle(e.target.value)} placeholder="Ej. Av. Juárez"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-oaxaca-oro/50 bg-gray-50/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Colonia</label>
                  <input value={colonia} onChange={e => setColonia(e.target.value)} placeholder="Ej. Centro"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-oaxaca-oro/50 bg-gray-50/50" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Municipio</label>
                  <input value={municipio} onChange={e => setMunicipio(e.target.value)} placeholder="Ej. Oaxaca de Juárez"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-oaxaca-oro/50 bg-gray-50/50" />
                </div>
              </div>
              {/* Botón para pedir GPS manualmente si falló */}
              {(locEstado === 'fallo' || !locEstado) && (
                <button type="button" onClick={pedirGPS}
                  className="w-full py-2.5 rounded-xl border border-oaxaca-guinda text-oaxaca-guinda text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <span>📡</span> Usar mi ubicación actual
                </button>
              )}
            </div>
          </section>
        )}

        {/* ── Paso 3: Descripción ── */}
        {formularioHabilitado && (
          <section className="bg-white rounded-2xl shadow-md p-5 border border-oaxaca-crema-dark">
            <h2 className="font-bold text-oaxaca-guinda mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-oaxaca-guinda text-white rounded-md flex items-center justify-center text-xs font-bold">3</span>
              Detalles Adicionales <span className="text-xs font-normal text-gray-400">(opcional)</span>
            </h2>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
              placeholder="Describe el bache: tamaño, si ya causó accidentes, etc."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-oaxaca-oro/50 bg-gray-50/50 resize-none" />
          </section>
        )}

        {/* ── Botón enviar ── */}
        {formularioHabilitado && (
          <div className="pb-4 space-y-2">
            {!tieneUbicacion && (
              <p className="text-xs text-center text-amber-600 font-medium">⚠️ Marca la ubicación en el mapa para continuar</p>
            )}
            {errorEnvio && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 text-center">{errorEnvio}</div>
            )}
            <button type="button" onClick={handleSubmit} disabled={!puedeEnviar}
              className="w-full bg-oaxaca-guinda disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl text-base uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-transform">
              {enviando
                ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando…</>
                : <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>Enviar Reporte</>
              }
            </button>
          </div>
        )}

        {/* Mensajes de estado */}
        {aiEstado === 'cargando' && (
          <p className="text-center text-xs text-gray-400 pb-4">El formulario se habilitará una vez que se verifique la foto</p>
        )}
        {!foto && !aiEstado && (
          <p className="text-center text-xs text-gray-400 pb-4">📸 Primero toma o sube una foto del bache para continuar</p>
        )}
      </main>
    </div>
  )
}
