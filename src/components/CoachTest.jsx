import { useState } from 'react'
import { coachAPI } from '../services/api'

export default function CoachTest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [zoneType, setZoneType] = useState('heartrate')
  const [assistantId, setAssistantId] = useState('')

  const handleGetAthletes = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await coachAPI.getAthletes()
      setResults({ type: 'athletes', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await coachAPI.getProfile()
      setResults({ type: 'profile', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetAthletesZones = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await coachAPI.getAthletesZones()
      setResults({ type: 'athletes-zones', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetAthletesZonesByType = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await coachAPI.getAthletesZonesByType(zoneType)
      setResults({ type: `athletes-zones-${zoneType}`, data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetAssistants = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await coachAPI.getAssistants()
      setResults({ type: 'assistants', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetAssistant = async () => {
    if (!assistantId.trim()) {
      setError('Please enter an assistant ID')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await coachAPI.getAssistant(assistantId.trim())
      setResults({ type: 'assistant', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetAssistantAthletes = async () => {
    if (!assistantId.trim()) {
      setError('Please enter an assistant ID')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await coachAPI.getAssistantAthletes(assistantId.trim())
      setResults({ type: 'assistant-athletes', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="api-card">
      <div className="api-card-header">
        <h3>Coach API</h3>
      </div>
      
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="api-actions">
        <div className="action-group">
          <button onClick={handleGetProfile} disabled={loading}>
            {loading ? 'Loading...' : 'Get Coach Profile'}
          </button>
        </div>
        
        <div className="action-group">
          <button onClick={handleGetAthletes} disabled={loading}>
            Get Coach Athletes
          </button>
        </div>
        
        <div className="action-group">
          <button onClick={handleGetAthletesZones} disabled={loading}>
            Get Athletes Zones
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
          <button onClick={handleGetAthletesZonesByType} disabled={loading}>
            Get Athletes Zones by Type
          </button>
        </div>
        
        <div className="action-group">
          <button onClick={handleGetAssistants} disabled={loading}>
            Get Assistants
          </button>
        </div>
        
        <div className="action-group">
          <input
            type="text"
            placeholder="Assistant ID"
            value={assistantId}
            onChange={(e) => setAssistantId(e.target.value)}
            style={{ marginRight: '0.5rem', padding: '0.5rem' }}
          />
          <button onClick={handleGetAssistant} disabled={loading}>
            Get Assistant
          </button>
        </div>
        
        <div className="action-group">
          <input
            type="text"
            placeholder="Assistant ID"
            value={assistantId}
            onChange={(e) => setAssistantId(e.target.value)}
            style={{ marginRight: '0.5rem', padding: '0.5rem' }}
          />
          <button onClick={handleGetAssistantAthletes} disabled={loading}>
            Get Assistant Athletes
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#888', margin: '0.5rem 0 0 0' }}>
          Note: Requires coach:athletes scope
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


