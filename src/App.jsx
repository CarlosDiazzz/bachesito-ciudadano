import { useState } from 'react'
import ReportarBache from './pages/ReportarBache'
import SplashScreen from './components/SplashScreen'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [openCamera, setOpenCamera] = useState(false)

  if (loading) {
    return <SplashScreen onFinish={() => { setLoading(false); setOpenCamera(true); }} />
  }

  return <ReportarBache autoOpenCamera={openCamera} />
}
