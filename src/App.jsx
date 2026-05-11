import { useState } from 'react'
import ReportarBache from './pages/ReportarBache'
import SplashScreen from './components/SplashScreen'
import CameraView from './components/CameraView'

export default function App() {
  const [view, setView] = useState('splash') // splash, camera, form
  const [capturedPhoto, setCapturedPhoto] = useState(null)

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
