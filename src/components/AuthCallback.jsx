import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { exchangeCodeForTokens } from '../services/auth'

export default function AuthCallback({ onAuthSuccess }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('Processing authentication...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
          setStatus(`Authentication error: ${error}`)
          setTimeout(() => navigate('/'), 3000)
          return
        }

        if (!code || !state) {
          setStatus('Missing authorization code or state')
          setTimeout(() => navigate('/'), 3000)
          return
        }

        await exchangeCodeForTokens(code, state)
        
        // Trigger storage event to notify other components
        window.dispatchEvent(new Event('auth-storage-updated'))
        
        // Call callback if provided
        if (onAuthSuccess) {
          onAuthSuccess()
        }
        
        setStatus('Authentication successful! Redirecting...')
        setTimeout(() => navigate('/'), 1500)
      } catch (err) {
        setStatus(`Error: ${err.message}`)
        setTimeout(() => navigate('/'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, navigate, onAuthSuccess])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div className="spinner" style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #646cff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p>{status}</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

