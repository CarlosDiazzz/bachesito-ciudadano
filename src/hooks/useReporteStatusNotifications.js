import { useEffect, useRef } from 'react'
import { showSystemNotification } from '../utils/systemNotifications'

const STORAGE_KEY = 'bachesito.reportes.estado.snapshot'
const FINAL_STATES = new Set(['resuelto', 'cerrado'])

function loadSnapshot() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveSnapshot(snapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

function normalizeReportes(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

export function useReporteStatusNotifications(statusUrl, pollMs = 30000) {
  const snapshotRef = useRef(loadSnapshot())

  useEffect(() => {
    if (!statusUrl) return undefined

    let cancelled = false
    let timerId = null

    const poll = async () => {
      try {
        const response = await fetch(statusUrl, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        })

        if (!response.ok) return

        const payload = await response.json()
        const reportes = normalizeReportes(payload)
        if (!reportes.length) return

        const previous = snapshotRef.current
        const current = {}

        for (const reporte of reportes) {
          if (!reporte?.id) continue
          const id = String(reporte.id)
          const estado = String(reporte.estado ?? '').toLowerCase()
          const folio = reporte.folio ?? id

          current[id] = estado

          if (previous[id] && previous[id] !== estado && FINAL_STATES.has(estado)) {
            // Notifica solo cuando hay transición real a estado final.
            await showSystemNotification({
              title: 'Reporte atendido',
              body: `Tu reporte ${folio} fue marcado como ${estado}.`,
              tag: `reporte-${id}-${estado}`,
              data: { reporteId: id },
            })
          }
        }

        snapshotRef.current = { ...previous, ...current }
        saveSnapshot(snapshotRef.current)
      } catch {
        // Errores de red/auth no deben romper el flujo de la app.
      }
    }

    poll()
    timerId = window.setInterval(() => {
      if (!cancelled) poll()
    }, pollMs)

    return () => {
      cancelled = true
      if (timerId) window.clearInterval(timerId)
    }
  }, [statusUrl, pollMs])
}
