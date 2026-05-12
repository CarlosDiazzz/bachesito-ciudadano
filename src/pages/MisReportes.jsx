import { useState, useEffect, useRef, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8001/api'

const PRIO_COLOR  = { critica: '#9D2449', alta: '#C05621', media: '#B7791F', baja: '#276749' }
const PRIO_EMOJI  = { critica: '🔴', alta: '🟠', media: '🟡', baja: '🟢' }
const ESTADO_CFG  = {
  pendiente:  { label: 'Pendiente',  cls: 'bg-yellow-100 text-yellow-800' },
  validado:   { label: 'Validado',   cls: 'bg-blue-100 text-blue-800' },
  rechazado:  { label: 'Rechazado',  cls: 'bg-red-100 text-red-800' },
  asignado:   { label: 'Asignado',   cls: 'bg-purple-100 text-purple-800' },
  en_proceso: { label: 'En proceso', cls: 'bg-orange-100 text-orange-800' },
  resuelto:   { label: 'Resuelto',   cls: 'bg-green-100 text-green-800' },
  cerrado:    { label: 'Cerrado',    cls: 'bg-gray-100 text-gray-600' },
}

const PLACEHOLDER = 'https://placehold.co/400x300/E2E8F0/94A3B8?text=Sin+foto'

function popupHtml(r) {
  const color  = PRIO_COLOR[r.prioridad] ?? '#4A5568'
  const emoji  = PRIO_EMOJI[r.prioridad] ?? '⚪'
  const estado = ESTADO_CFG[r.estado]    ?? { label: r.estado }
  const foto   = r.foto && !r.foto.includes('placehold') ? r.foto : null

  return `
    <div style="font-family:Inter,sans-serif;width:220px;overflow:hidden;border-radius:4px">
      ${foto ? `<img src="${foto}" style="width:100%;height:120px;object-fit:cover;display:block;margin:-10px -20px 8px;width:calc(100% + 40px)" onerror="this.style.display='none'" />` : ''}
      <div style="font-size:10px;color:#9099B8;font-family:monospace;margin-bottom:2px">${r.folio ?? ''}</div>
      <div style="font-weight:700;font-size:13px;color:#1a202c;margin-bottom:3px;line-height:1.3">${r.nombre_via ?? 'Sin nombre'}</div>
      <div style="font-size:11px;color:#5A6080;margin-bottom:6px">${[r.colonia, r.municipio].filter(Boolean).join(' · ')}</div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span style="font-size:11px;font-weight:600;color:${color}">${emoji} ${r.prioridad ?? ''}</span>
        <span style="font-size:10px;background:#F1F5F9;color:#475569;padding:1px 7px;border-radius:99px;font-weight:600">${estado.label}</span>
      </div>
      ${r.descripcion ? `<div style="font-size:11px;color:#64748B;margin-top:5px;line-height:1.4;border-top:1px solid #F1F5F9;padding-top:5px">${r.descripcion.slice(0,90)}${r.descripcion.length>90?'…':''}</div>` : ''}
    </div>
  `
}

// ── Mapa con clustering ───────────────────────────────────────────────────────
function MapaLeaflet({ reportes, seleccionado, onSelect }) {
  const contenedorRef  = useRef(null)
  const mapaRef        = useRef(null)
  const clusterRef     = useRef(null)
  const marcadoresRef  = useRef({})

  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current || !window.L) return
    const L   = window.L
    const map = L.map(contenedorRef.current, { center: [17.0732, -96.7266], zoom: 13, zoomControl: true })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    mapaRef.current = map
    return () => { map.remove(); mapaRef.current = null; clusterRef.current = null }
  }, [])

  useEffect(() => {
    const L = window.L
    if (!mapaRef.current || !L) return
    const map    = mapaRef.current
    const validos = reportes.filter(r => r.latitud && r.longitud)

    // Limpiar capa anterior
    if (clusterRef.current) { map.removeLayer(clusterRef.current) }
    marcadoresRef.current = {}

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      iconCreateFunction: count => {
        const n = count.getChildCount()
        const size = n > 20 ? 48 : n > 5 ? 40 : 34
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:#9D2449;border:3px solid white;
            display:flex;align-items:center;justify-content:center;
            color:white;font-weight:800;font-size:${size > 40 ? 15 : 12}px;
            box-shadow:0 2px 10px rgba(157,36,73,0.45);
          ">${n}</div>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })
      },
    })

    validos.forEach(r => {
      const color = PRIO_COLOR[r.prioridad] ?? '#4A5568'
      const icon  = L.divIcon({
        html: `<div style="
          width:30px;height:30px;border-radius:50%;
          background:${color};border:2.5px solid white;
          box-shadow:0 2px 7px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;
        ">🕳</div>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      const mk = L.marker([r.latitud, r.longitud], { icon })
      mk.bindPopup(popupHtml(r), { maxWidth: 240, className: 'bachesito-popup' })
      mk.on('click', () => onSelect(r))
      cluster.addLayer(mk)
      marcadoresRef.current[r.id] = mk
    })

    map.addLayer(cluster)
    clusterRef.current = cluster

    if (validos.length > 0) {
      map.fitBounds(L.latLngBounds(validos.map(r => [r.latitud, r.longitud])), { padding: [30, 30], maxZoom: 15 })
    }
  }, [reportes])

  // Volar al seleccionado y abrir su popup
  useEffect(() => {
    const L = window.L
    if (!mapaRef.current || !seleccionado?.latitud || !L) return
    mapaRef.current.flyTo([seleccionado.latitud, seleccionado.longitud], 17, { duration: 0.6 })
    const mk = marcadoresRef.current[seleccionado.id]
    if (mk) setTimeout(() => mk.openPopup(), 650)
  }, [seleccionado])

  return (
    <div
      ref={contenedorRef}
      style={{ width: '100%', height: '340px', zIndex: 0 }}
      className="rounded-2xl overflow-hidden border border-gray-200 shadow"
    />
  )
}

// ── Panel análisis de zona ────────────────────────────────────────────────────
function PanelZona({ reportes }) {
  const [datos,    setDatos]    = useState(null)
  const [cargando, setCargando] = useState(false)
  const pedidoRef = useRef(false)

  useEffect(() => {
    if (!reportes.length || pedidoRef.current) return
    pedidoRef.current = true
    setCargando(true)
    fetch(`${API_BASE}/ai/zona`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ reportes }),
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setDatos)
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [reportes])

  if (cargando) return (
    <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
      <div className="w-5 h-5 rounded-full border-2 border-oaxaca-guinda border-t-transparent animate-spin shrink-0" />
      <p className="text-xs text-gray-500">Revisando el estado de la zona…</p>
    </div>
  )
  if (!datos?.resumen) return null

  const { resumen, alerta, zonas_criticas, consejo, stats } = datos
  return (
    <div className={`rounded-2xl overflow-hidden border shadow-sm ${alerta ? 'border-red-200' : 'border-emerald-200'}`}>
      <div className={`px-4 py-2.5 flex items-center gap-2 ${alerta ? 'bg-red-50' : 'bg-emerald-50'}`}>
        <span>{alerta ? '⚠️' : '✅'}</span>
        <p className={`text-xs font-bold flex-1 ${alerta ? 'text-red-700' : 'text-emerald-700'}`}>
          {alerta ? 'Zona con daños importantes' : 'Zona en buen estado'}
        </p>
        {stats && (
          <div className="flex gap-1.5 text-[10px] font-bold">
            <span className="bg-white/80 text-gray-600 px-2 py-0.5 rounded-full">{stats.total} reportes</span>
            {stats.criticos > 0 && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{stats.criticos} críticos</span>}
          </div>
        )}
      </div>
      <div className="bg-white px-4 py-3 space-y-2.5">
        <p className="text-sm text-gray-700 leading-relaxed">{resumen}</p>
        {zonas_criticas?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {zonas_criticas.map((z, i) => (
              <span key={i} className="bg-oaxaca-guinda/10 text-oaxaca-guinda text-[11px] font-semibold px-2.5 py-1 rounded-full">
                📍 {z}
              </span>
            ))}
          </div>
        )}
        {consejo && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 border-l-2 border-oaxaca-oro">{consejo}</p>
        )}
      </div>
    </div>
  )
}

// ── Card de reporte ───────────────────────────────────────────────────────────
function ReporteCard({ reporte, activo, onClick }) {
  const color  = PRIO_COLOR[reporte.prioridad] ?? '#4A5568'
  const estado = ESTADO_CFG[reporte.estado]    ?? { label: reporte.estado, cls: 'bg-gray-100 text-gray-600' }
  const foto   = reporte.foto && !reporte.foto.includes('placehold') ? reporte.foto : null

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border overflow-hidden transition-all active:scale-[0.98] ${
        activo ? 'shadow-md ring-2 ring-oaxaca-guinda/40' : 'shadow-sm'
      }`}
      style={{ borderColor: activo ? color : '#E5E7EB' }}
    >
      {foto && <img src={foto} alt="" className="w-full h-32 object-cover" onError={e => e.target.style.display = 'none'} />}
      <div className="bg-white px-4 py-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color }}>{reporte.nombre_via ?? 'Sin nombre'}</p>
            <p className="text-[11px] text-gray-400 truncate">
              {[reporte.colonia, reporte.municipio].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${estado.cls}`}>
            {estado.label}
          </span>
        </div>
        {reporte.descripcion && (
          <p className="text-xs text-gray-500 line-clamp-2">{reporte.descripcion}</p>
        )}
        <div className="flex items-center gap-1 pt-0.5">
          <span className="text-xs">{PRIO_EMOJI[reporte.prioridad] ?? '⚪'}</span>
          <span className="text-[11px] font-semibold capitalize" style={{ color }}>{reporte.prioridad}</span>
          {reporte.folio && <span className="ml-auto text-[10px] font-mono text-gray-300">{reporte.folio}</span>}
        </div>
      </div>
    </button>
  )
}

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-28 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────
export default function MisReportes({ onNuevoReporte }) {
  const [reportes,     setReportes]     = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [error,        setError]        = useState(null)
  const [seleccionado, setSeleccionado] = useState(null)
  const [tab,          setTab]          = useState('mapa')

  useEffect(() => {
    fetch(`${API_BASE}/reportes/mapa`, { headers: { Accept: 'application/json' } })
      .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json() })
      .then(data => {
        const lista = Array.isArray(data) ? data : (data.data ?? [])
        setReportes(lista)
        if (lista.length) setSeleccionado(lista[0])
      })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  const handleSelect = useCallback(r => setSeleccionado(r), [])
  const validos = reportes.filter(r => r.latitud && r.longitud)

  return (
    <div className="min-h-screen bg-oaxaca-crema flex flex-col">

      {/* Header */}
      <header className="bg-oaxaca-guinda text-white px-4 pt-4 pb-0 shadow-lg border-b-2 border-oaxaca-oro shrink-0">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold uppercase tracking-tight">Baches en Oaxaca</h1>
              <p className="text-oaxaca-oro text-[10px] font-bold uppercase tracking-widest">Mapa ciudadano</p>
            </div>
            {!cargando && !error && (
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                {reportes.length} {reportes.length === 1 ? 'reporte' : 'reportes'}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {[{ id: 'mapa', label: '🗺 Mapa' }, { id: 'lista', label: '📋 Lista' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border-b-2 -mb-px transition-colors
                  ${tab === t.id ? 'border-oaxaca-oro text-white' : 'border-transparent text-white/50'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full pb-28">

        {cargando && (
          <div className="px-4 pt-4 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} />)}</div>
        )}

        {error && (
          <div className="mx-4 mt-6 bg-red-50 border border-red-200 rounded-2xl p-5 text-center text-red-600">
            <p className="font-semibold mb-1">No se pudieron cargar los reportes</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!cargando && !error && reportes.length === 0 && (
          <div className="text-center py-24 text-gray-400 px-4">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="font-semibold text-lg">Sin reportes todavía</p>
            <p className="text-sm mt-1">¡Sé el primero en reportar un bache!</p>
          </div>
        )}

        {/* ── Tab: Mapa ── */}
        {!cargando && !error && reportes.length > 0 && tab === 'mapa' && (
          <div className="flex flex-col gap-3 px-4 pt-4">

            <PanelZona reportes={reportes} />

            <MapaLeaflet reportes={validos} seleccionado={seleccionado} onSelect={handleSelect} />

            {/* Leyenda */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
              {Object.entries(PRIO_COLOR).map(([p, c]) => (
                <div key={p} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded-full inline-block border-2 border-white shadow-sm" style={{ background: c }} />
                  <span className="capitalize">{p}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-white text-[9px] font-black shadow-sm" style={{ background: '#9D2449' }}>N</span>
                <span>Zona agrupada</span>
              </div>
            </div>

            {/* Cards deslizables */}
            {validos.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
                  Toca para ver en el mapa
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
                  {validos.map(r => (
                    <div key={r.id} className="snap-start shrink-0 w-64">
                      <ReporteCard reporte={r} activo={seleccionado?.id === r.id} onClick={() => handleSelect(r)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Lista ── */}
        {!cargando && !error && reportes.length > 0 && tab === 'lista' && (
          <div className="px-4 pt-4 space-y-3">
            {reportes.map(r => (
              <ReporteCard key={r.id} reporte={r} activo={seleccionado?.id === r.id} onClick={() => { handleSelect(r); setTab('mapa') }} />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={onNuevoReporte}
        className="fixed bottom-20 right-5 bg-oaxaca-guinda text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl active:scale-95 transition-transform z-50"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
