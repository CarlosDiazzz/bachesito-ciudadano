import { useState } from 'react'
import ReportarBache from './pages/ReportarBache'
import MisReportes from './pages/MisReportes'
import SplashScreen from './components/SplashScreen'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('reportar')

  if (loading) {
    return <SplashScreen onFinish={() => setLoading(false)} />
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        {vista === 'reportar'
          ? <ReportarBache />
          : <MisReportes onNuevoReporte={() => setVista('reportar')} />
        }
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-oaxaca-crema-dark shadow-lg">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => setVista('reportar')}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-bold uppercase tracking-wide transition-colors
              ${vista === 'reportar' ? 'text-oaxaca-guinda border-t-2 border-oaxaca-guinda -mt-px' : 'text-gray-400'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Reportar
          </button>
          <button
            onClick={() => setVista('mis-reportes')}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-bold uppercase tracking-wide transition-colors
              ${vista === 'mis-reportes' ? 'text-oaxaca-guinda border-t-2 border-oaxaca-guinda -mt-px' : 'text-gray-400'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Mis Reportes
          </button>
        </div>
      </nav>

      {/* Espaciado para no tapar contenido con el nav */}
      <div className="h-16" />
    </div>
  )
}
