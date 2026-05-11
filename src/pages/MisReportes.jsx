import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
  validado:   { label: 'Validado',   color: 'bg-blue-100 text-blue-800',     dot: 'bg-blue-400' },
  rechazado:  { label: 'Rechazado',  color: 'bg-red-100 text-red-800',       dot: 'bg-red-400' },
  asignado:   { label: 'Asignado',   color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-400' },
  en_proceso: { label: 'En proceso', color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-400' },
  resuelto:   { label: 'Resuelto',   color: 'bg-green-100 text-green-800',   dot: 'bg-green-500' },
  cerrado:    { label: 'Cerrado',    color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
}

const PRIORIDAD_CONFIG = {
  critica: { label: 'Crítica', color: 'text-red-600',    icon: '🔴' },
  alta:    { label: 'Alta',    color: 'text-orange-600', icon: '🟠' },
  media:   { label: 'Media',   color: 'text-yellow-600', icon: '🟡' },
  baja:    { label: 'Baja',    color: 'text-green-600',  icon: '🟢' },
}

function formatFecha(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] ?? { label: estado, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-oaxaca-crema-dark p-5 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-40" />
        <div className="h-5 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-24" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
    </div>
  )
}

export default function MisReportes({ onNuevoReporte }) {
  const [reportes, setReportes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('bachesito_token')

    fetch(`${API_BASE}/reportes`, {
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`)
        return res.json()
      })
      .then((json) => setReportes(json.data ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="min-h-screen bg-oaxaca-crema">
      {/* Header */}
      <header className="bg-oaxaca-guinda text-white px-4 py-4 shadow-lg border-b-2 border-oaxaca-oro">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold uppercase tracking-tight">Mis Reportes</h1>
            <p className="text-oaxaca-oro text-[10px] font-bold uppercase tracking-widest">BachesITO Ciudadano</p>
          </div>
          {!cargando && !error && (
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              {reportes.length} {reportes.length === 1 ? 'reporte' : 'reportes'}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-24">

        {/* Estado de carga */}
        {cargando && [1, 2, 3].map((i) => <Skeleton key={i} />)}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center text-red-600">
            <p className="font-semibold mb-1">No se pudieron cargar los reportes</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Sin reportes */}
        {!cargando && !error && reportes.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-semibold">Aún no tienes reportes</p>
            <p className="text-sm mt-1">¡Reporta tu primer bache!</p>
          </div>
        )}

        {/* Lista de reportes */}
        {!cargando && !error && reportes.map((reporte) => {
          const prioridad = PRIORIDAD_CONFIG[reporte.prioridad] ?? { label: reporte.prioridad, color: 'text-gray-500', icon: '⚪' }
          return (
            <div key={reporte.id} className="bg-white rounded-2xl shadow-sm border border-oaxaca-crema-dark overflow-hidden">
              {/* Foto si existe */}
              {reporte.foto_principal && (
                <img src={reporte.foto_principal} alt="Foto del bache"
                  className="w-full h-36 object-cover" />
              )}

              {/* Encabezado */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <span className="text-[11px] font-mono text-gray-400 tracking-wide">{reporte.folio}</span>
                <EstadoBadge estado={reporte.estado} />
              </div>

              {/* Cuerpo */}
              <div className="px-4 pb-4 space-y-2">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-oaxaca-guinda mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{reporte.nombre_via}</p>
                    <p className="text-xs text-gray-400">
                      {[reporte.colonia, reporte.municipio].filter(Boolean).join(' — ')}
                    </p>
                  </div>
                </div>

                {reporte.descripcion && (
                  <p className="text-sm text-gray-500 line-clamp-2">{reporte.descripcion}</p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className={`text-xs font-semibold ${prioridad.color}`}>
                    {prioridad.icon} Prioridad {prioridad.label}
                  </span>
                  <span className="text-xs text-gray-400">{formatFecha(reporte.fecha_reporte)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </main>

      {/* Botón flotante nuevo reporte */}
      <button
        onClick={onNuevoReporte}
        className="fixed bottom-20 right-5 bg-oaxaca-guinda text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl hover:bg-oaxaca-guinda-dark transition-colors"
        title="Nuevo reporte"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
