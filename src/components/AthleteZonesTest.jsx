import { useState } from 'react'
import { athleteAPI } from '../services/api'

export default function AthleteZonesTest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [zoneType, setZoneType] = useState('heartrate')

  const handleGetZones = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await athleteAPI.getZones()
      setResults({ type: 'zones', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetZonesByType = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await athleteAPI.getZonesByType(zoneType)
      setResults({ type: `zones-${zoneType}`, data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="api-card">
      <div className="api-card-header">
        <h3>Athlete Zones API</h3>
      </div>
      
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="api-actions">
        <div className="action-group">
          <button onClick={handleGetZones} disabled={loading}>
            {loading ? 'Loading...' : 'Get All Zones'}
          </button>
        </div>
        
        <div className="action-group">
          <select
            value={zoneType}
            onChange={(e) => setZoneType(e.target.value)}
            style={{ marginRight: '0.5rem', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="heartrate">Heart Rate</option>
            <option value="speed">Speed</option>
            <option value="power">Power</option>
          </select>
          <button onClick={handleGetZonesByType} disabled={loading}>
            Get Zones by Type
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#888', margin: '0.5rem 0 0 0' }}>
          Endpoints: v1/athlete/zones, v1/athlete/profile/zones/{'{'}type{'}'}
        </p>
      </div>
      
      {results && (
        <div className="api-response">
          <h4>Response ({results.type}):</h4>
          <pre>{JSON.stringify(results.data, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}


