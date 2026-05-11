import { useState } from 'react'
import ReportarBache from './pages/ReportarBache'
import SplashScreen from './components/SplashScreen'

export default function App() {
  const [loading, setLoading] = useState(true)

  if (loading) {
    return <SplashScreen onFinish={() => setLoading(false)} />
  }

  return <ReportarBache />
}
