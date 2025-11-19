import { initiateLogin, clearTokens, isAuthenticated } from '../services/auth'

export default function AuthButton({ onAuthChange }) {
  const handleLogin = async () => {
    try {
      await initiateLogin()
    } catch (error) {
      console.error('Login error:', error)
      alert(`Login error: ${error.message}`)
    }
  }

  const handleLogout = () => {
    clearTokens()
    if (onAuthChange) {
      onAuthChange()
    }
  }

  if (isAuthenticated()) {
    return (
      <button 
        onClick={handleLogout}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '500',
        }}
      >
        Logout
      </button>
    )
  }

  return (
    <button 
      onClick={handleLogin}
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#646cff',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '500',
      }}
    >
      Login with TrainingPeaks
    </button>
  )
}

