import { useState } from 'react'
import { OAUTH_CONFIG } from '../config/oauth'
import { getValidAccessToken } from '../services/auth'

export default function EndpointTester() {
  const [endpoint, setEndpoint] = useState('/v3/athletes/me')
  const [method, setMethod] = useState('GET')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)

  const testEndpoint = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const accessToken = await getValidAccessToken()
      
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'TrainingPeaks API Tester/1.0',
        },
      }

      if (method !== 'GET' && method !== 'HEAD' && body.trim()) {
        try {
          options.body = JSON.stringify(JSON.parse(body))
        } catch (e) {
          throw new Error('Invalid JSON in request body')
        }
      }

      const fullUrl = `${OAUTH_CONFIG.apiBaseUrl}${endpoint}`
      
      // Log the request for debugging
      console.log('Making request to:', fullUrl)
      console.log('Headers:', options.headers)
      
      const res = await fetch(fullUrl, options)
      
      const contentType = res.headers.get('content-type')
      let data
      let responseText

      if (contentType && contentType.includes('application/json')) {
        data = await res.json()
        responseText = JSON.stringify(data, null, 2)
      } else {
        responseText = await res.text()
        try {
          data = JSON.parse(responseText)
        } catch {
          data = { raw: responseText }
        }
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data: data,
        formatted: responseText,
        url: fullUrl,
      })

      if (!res.ok) {
        setError(`${res.status} ${res.statusText}`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="api-card">
      <div className="api-card-header">
        <h3>Endpoint Tester</h3>
        <p style={{ fontSize: '0.9rem', color: '#888', margin: 0 }}>
          Test any TrainingPeaks API endpoint
        </p>
      </div>

      <div className="api-actions" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Endpoint:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/v3/athletes/me"
                style={{ 
                  flex: 1, 
                  padding: '0.5rem', 
                  borderRadius: '6px', 
                  border: '1px solid #ddd',
                  fontFamily: 'monospace'
                }}
              />
              <button onClick={testEndpoint} disabled={loading}>
                {loading ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>

          {(method === 'POST' || method === 'PUT') && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Request Body (JSON):
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick test buttons */}
      <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500', fontSize: '0.9rem' }}>Quick Tests - Try Different Endpoint Formats:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <strong style={{ fontSize: '0.85rem' }}>With /v1/ prefix (from docs):</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button 
                onClick={() => { setEndpoint('/v1/athlete/profile'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: '#28a745', color: 'white' }}
              >
                /v1/athlete/profile ⭐
              </button>
              <button 
                onClick={() => { setEndpoint('/v1/athlete'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /v1/athlete
              </button>
              <button 
                onClick={() => { setEndpoint('/v1/workouts'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /v1/workouts
              </button>
              <button 
                onClick={() => { setEndpoint('/v1/events'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /v1/events
              </button>
              <button 
                onClick={() => { setEndpoint('/v1/metrics'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /v1/metrics
              </button>
            </div>
          </div>
          <div>
            <strong style={{ fontSize: '0.85rem' }}>With /v3/ prefix:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button 
                onClick={() => { setEndpoint('/v3/athletes/me'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /v3/athletes/me
              </button>
              <button 
                onClick={() => { setEndpoint('/v3/athlete/me'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /v3/athlete/me
              </button>
              <button 
                onClick={() => { setEndpoint('/v3/workouts'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /v3/workouts
              </button>
              <button 
                onClick={() => { setEndpoint('/v3/events'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /v3/events
              </button>
            </div>
          </div>
          <div>
            <strong style={{ fontSize: '0.85rem' }}>Without /v3/ prefix:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button 
                onClick={() => { setEndpoint('/athletes/me'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /athletes/me
              </button>
              <button 
                onClick={() => { setEndpoint('/athlete/me'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /athlete/me
              </button>
              <button 
                onClick={() => { setEndpoint('/athletes'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /athletes
              </button>
              <button 
                onClick={() => { setEndpoint('/workouts'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /workouts
              </button>
              <button 
                onClick={() => { setEndpoint('/events'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /events
              </button>
            </div>
          </div>
          <div>
            <strong style={{ fontSize: '0.85rem' }}>Alternative patterns:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button 
                onClick={() => { setEndpoint('/api/v3/athletes/me'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /api/v3/athletes/me
              </button>
              <button 
                onClick={() => { setEndpoint('/rest/v3/athletes/me'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /rest/v3/athletes/me
              </button>
              <button 
                onClick={() => { setEndpoint('/v1/athletes/me'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /v1/athletes/me
              </button>
              <button 
                onClick={() => { setEndpoint('/athletes/me'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /athletes/me
              </button>
              <button 
                onClick={() => { setEndpoint('/user'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /user
              </button>
              <button 
                onClick={() => { setEndpoint('/user/me'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /user/me
              </button>
              <button 
                onClick={() => { setEndpoint('/profile'); setMethod('GET'); }}
                disabled={loading}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                /profile
              </button>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffc107' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#856404' }}>
              <strong>💡 Tip:</strong> Check the TrainingPeaks API documentation at{' '}
              <a href="https://github.com/TrainingPeaks/PartnersAPI/wiki" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>
                https://github.com/TrainingPeaks/PartnersAPI/wiki
              </a>
              {' '}for the correct endpoint structure. The 403 on root confirms your authentication works!
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div className="api-response">
          <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>
              Response ({response.status} {response.statusText})
            </h4>
            <button 
              onClick={() => setResponse(null)}
              style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', background: '#666' }}
            >
              Clear
            </button>
          </div>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <p style={{ margin: '0 0 0.25rem 0', color: '#888' }}>
              <strong>URL:</strong> <code style={{ background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{response.url}</code>
            </p>
            <details style={{ marginTop: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', color: '#646cff' }}>View Response Headers</summary>
              <pre style={{ marginTop: '0.5rem', background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', overflow: 'auto' }}>
                {JSON.stringify(response.headers, null, 2)}
              </pre>
            </details>
          </div>
          <pre style={{ margin: 0, maxHeight: '400px', overflow: 'auto' }}>
            {response.formatted}
          </pre>
        </div>
      )}
    </div>
  )
}

