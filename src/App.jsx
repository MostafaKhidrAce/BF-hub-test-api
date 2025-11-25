import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { isAuthenticated } from './services/auth'
import AuthButton from './components/AuthButton'
import AuthCallback from './components/AuthCallback'
import AthleteProfile from './components/AthleteProfile'
import AthleteZonesTest from './components/AthleteZonesTest'
import WorkoutsTest from './components/WorkoutsTest'
import EventsTest from './components/EventsTest'
import MetricsTest from './components/MetricsTest'
import CoachTest from './components/CoachTest'
import WebhooksTest from './components/WebhooksTest'
import InfoTest from './components/InfoTest'
import EndpointTester from './components/EndpointTester'
import ApiDiagnostics from './components/ApiDiagnostics'
import TrainingCalendar from './components/TrainingCalendar'
import CoachDashboard from './components/CoachDashboard'
import './App.css'

function AppContent() {
  const location = useLocation()
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [currentView, setCurrentView] = useState('api-tests') // 'api-tests', 'training-calendar', 'coach-dashboard'

  const checkAuth = () => {
    setAuthenticated(isAuthenticated())
    setCheckingAuth(false)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  // Re-check authentication when location changes (e.g., coming back from callback)
  useEffect(() => {
    if (!checkingAuth) {
      checkAuth()
    }
  }, [location.pathname])

  // Listen for storage changes (when tokens are saved in callback)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('tp_')) {
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom event from callback
    const handleCustomStorage = () => {
      checkAuth()
    }
    window.addEventListener('auth-storage-updated', handleCustomStorage)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-storage-updated', handleCustomStorage)
    }
  }, [])

  const handleAuthChange = () => {
    checkAuth()
  }

  if (checkingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/callback" element={<AuthCallback onAuthSuccess={checkAuth} />} />
      <Route path="/" element={
        <div className="app-container">
          <header className="app-header">
            <h1>TrainingPeaks API Tester</h1>
            <p className="subtitle">Test and explore the TrainingPeaks Partner API</p>
            <div className="header-actions">
              {authenticated && (
                <nav className="main-navigation">
                  <button 
                    className={`nav-link ${currentView === 'api-tests' ? 'active' : ''}`}
                    onClick={() => setCurrentView('api-tests')}
                  >
                    API Tests
                  </button>
                  <button 
                    className={`nav-link ${currentView === 'training-calendar' ? 'active' : ''}`}
                    onClick={() => setCurrentView('training-calendar')}
                  >
                    Training Calendar
                  </button>
                  <button 
                    className={`nav-link ${currentView === 'coach-dashboard' ? 'active' : ''}`}
                    onClick={() => setCurrentView('coach-dashboard')}
                  >
                    Coach Dashboard
                  </button>
                </nav>
              )}
              <AuthButton onAuthChange={handleAuthChange} />
            </div>
          </header>

          {authenticated ? (
            <main className="app-main">
              {currentView === 'training-calendar' && (
                <TrainingCalendar />
              )}
              
              {currentView === 'coach-dashboard' && (
                <CoachDashboard />
              )}

              {currentView === 'api-tests' && (
                <>
                  <div className="info-banner">
                    <p>
                      <strong>Sandbox Environment:</strong> You're connected to the TrainingPeaks sandbox.
                      Data is reset every Monday. OAuth tokens expire after 1 hour.
                    </p>
                  </div>

                  <div className="api-tests">
                <ApiDiagnostics />
                <InfoTest />
                <EndpointTester />
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <h2 style={{ margin: '2rem 0 1rem 0', paddingBottom: '0.5rem', borderBottom: '2px solid rgba(100, 108, 255, 0.2)' }}>
                    Athlete Endpoints
                  </h2>
                </div>
                <AthleteProfile />
                <AthleteZonesTest />
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <h2 style={{ margin: '2rem 0 1rem 0', paddingBottom: '0.5rem', borderBottom: '2px solid rgba(100, 108, 255, 0.2)' }}>
                    Workouts Endpoints
                  </h2>
                </div>
                <WorkoutsTest />
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <h2 style={{ margin: '2rem 0 1rem 0', paddingBottom: '0.5rem', borderBottom: '2px solid rgba(100, 108, 255, 0.2)' }}>
                    Events Endpoints
                  </h2>
                </div>
                <EventsTest />
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <h2 style={{ margin: '2rem 0 1rem 0', paddingBottom: '0.5rem', borderBottom: '2px solid rgba(100, 108, 255, 0.2)' }}>
                    Metrics Endpoints
                  </h2>
                </div>
                <MetricsTest />
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <h2 style={{ margin: '2rem 0 1rem 0', paddingBottom: '0.5rem', borderBottom: '2px solid rgba(100, 108, 255, 0.2)' }}>
                    Coach Endpoints (Requires coach:athletes scope)
                  </h2>
                </div>
                <CoachTest />
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <h2 style={{ margin: '2rem 0 1rem 0', paddingBottom: '0.5rem', borderBottom: '2px solid rgba(100, 108, 255, 0.2)' }}>
                    Webhooks (Early Access)
                  </h2>
                </div>
                <WebhooksTest />
                  </div>
                </>
              )}
            </main>
          ) : (
            <div className="login-prompt">
              <div className="login-card">
                <h2>Get Started</h2>
                <p>Please log in with your TrainingPeaks account to test the API endpoints.</p>
                <AuthButton onAuthChange={handleAuthChange} />
                <p className="login-note">
                  You'll be redirected to TrainingPeaks to authorize this application.
                </p>
              </div>
            </div>
          )}
        </div>
      } />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
