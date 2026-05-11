import { useEffect, useState } from 'react'
import ReportarBache from './pages/ReportarBache'
import SplashScreen from './components/SplashScreen'
import CameraView from './components/CameraView'
import { useReporteStatusNotifications } from './hooks/useReporteStatusNotifications'

export default function App() {
  const [view, setView] = useState('splash') // splash, camera, form
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const reportesStatusUrl = import.meta.env.VITE_REPORTES_STATUS_URL || '/api/reportes?per_page=100&mine=1'

  useReporteStatusNotifications(reportesStatusUrl)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw-notifications.js').catch(() => {})
  }, [])

  if (view === 'splash') {
    return <SplashScreen onFinish={() => setView('camera')} />
  }

  if (view === 'camera') {
    return (
      <CameraView 
        onCapture={(file, preview) => {
          setCapturedPhoto({ file, preview })
          setView('form')
        }}
        onCancel={() => setView('form')}
      />
    )
  }

  return <ReportarBache initialPhoto={capturedPhoto} onRetake={() => setView('camera')} />
}
