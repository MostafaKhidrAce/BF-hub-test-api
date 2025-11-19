import { useState, useEffect } from 'react'
import { infoAPI } from '../services/api'

export default function InfoTest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(null)

  const fetchVersion = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await infoAPI.getVersion()
      setVersion(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVersion()
  }, [])

  return (
    <div className="api-card">
      <div className="api-card-header">
        <h3>API Info</h3>
        <button onClick={fetchVersion} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {loading && !version && (
        <div className="loading">Loading API version...</div>
      )}
      
      {version && (
        <div className="api-response">
          <pre>{JSON.stringify(version, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}


