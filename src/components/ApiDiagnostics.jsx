import { useState } from 'react'
import { OAUTH_CONFIG } from '../config/oauth'
import { getValidAccessToken, isAuthenticated } from '../services/auth'

export default function ApiDiagnostics() {
  const [diagnostics, setDiagnostics] = useState(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    const results = {
      timestamp: new Date().toISOString(),
      auth: {
        isAuthenticated: isAuthenticated(),
        hasAccessToken: !!localStorage.getItem('tp_access_token'),
        hasRefreshToken: !!localStorage.getItem('tp_refresh_token'),
      },
      apiBaseUrl: OAUTH_CONFIG.apiBaseUrl,
      tests: [],
    }

    try {
      // Test 1: Check if we can get access token
      let accessToken = null
      try {
        accessToken = await getValidAccessToken()
        results.tests.push({
          name: 'Get Access Token',
          status: 'success',
          message: 'Access token retrieved successfully',
          data: { tokenLength: accessToken?.length || 0 },
        })
      } catch (err) {
        results.tests.push({
          name: 'Get Access Token',
          status: 'error',
          message: err.message,
        })
      }

      if (accessToken) {
        // Test 2: Try root endpoint
        try {
          const res = await fetch(OAUTH_CONFIG.apiBaseUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          })
          const text = await res.text()
          results.tests.push({
            name: 'Root Endpoint (/)',
            status: res.ok ? 'success' : 'warning',
            statusCode: res.status,
            message: res.ok ? 'Root endpoint responds' : `Root endpoint returned ${res.status}`,
            data: { contentType: res.headers.get('content-type'), preview: text.substring(0, 200) },
          })
        } catch (err) {
          results.tests.push({
            name: 'Root Endpoint (/)',
            status: 'error',
            message: err.message,
          })
        }

        // Test 3: Try /api endpoint
        try {
          const res = await fetch(`${OAUTH_CONFIG.apiBaseUrl}/api`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          })
          const text = await res.text()
          results.tests.push({
            name: '/api Endpoint',
            status: res.ok ? 'success' : 'warning',
            statusCode: res.status,
            message: res.ok ? '/api endpoint responds' : `/api endpoint returned ${res.status}`,
            data: { contentType: res.headers.get('content-type'), preview: text.substring(0, 200) },
          })
        } catch (err) {
          results.tests.push({
            name: '/api Endpoint',
            status: 'error',
            message: err.message,
          })
        }

        // Test 4: Try OPTIONS on root to see allowed methods
        try {
          const res = await fetch(OAUTH_CONFIG.apiBaseUrl, {
            method: 'OPTIONS',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          })
          results.tests.push({
            name: 'OPTIONS Request (CORS/Allowed Methods)',
            status: 'info',
            statusCode: res.status,
            message: 'OPTIONS request completed',
            data: {
              allow: res.headers.get('Allow'),
              accessControlAllowMethods: res.headers.get('Access-Control-Allow-Methods'),
            },
          })
        } catch (err) {
          results.tests.push({
            name: 'OPTIONS Request',
            status: 'error',
            message: err.message,
          })
        }
      }
    } catch (err) {
      results.error = err.message
    }

    setDiagnostics(results)
    setLoading(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#28a745'
      case 'warning': return '#ffc107'
      case 'error': return '#dc3545'
      case 'info': return '#17a2b8'
      default: return '#6c757d'
    }
  }

  return (
    <div className="api-card">
      <div className="api-card-header">
        <h3>API Diagnostics</h3>
        <button onClick={runDiagnostics} disabled={loading}>
          {loading ? 'Running...' : 'Run Diagnostics'}
        </button>
      </div>

      <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
          This will test basic API connectivity and help identify the correct endpoint structure.
        </p>
      </div>

      {diagnostics && (
        <div>
          <h4 style={{ marginTop: 0 }}>Diagnostic Results</h4>
          <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#888' }}>
            <strong>API Base URL:</strong> <code>{diagnostics.apiBaseUrl}</code><br />
            <strong>Run Time:</strong> {new Date(diagnostics.timestamp).toLocaleString()}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h5 style={{ marginBottom: '0.5rem' }}>Authentication Status:</h5>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
              <li>Authenticated: {diagnostics.auth.isAuthenticated ? '✅ Yes' : '❌ No'}</li>
              <li>Has Access Token: {diagnostics.auth.hasAccessToken ? '✅ Yes' : '❌ No'}</li>
              <li>Has Refresh Token: {diagnostics.auth.hasRefreshToken ? '✅ Yes' : '❌ No'}</li>
            </ul>
          </div>

          <div>
            <h5 style={{ marginBottom: '0.5rem' }}>Endpoint Tests:</h5>
            {diagnostics.tests.map((test, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  border: `2px solid ${getStatusColor(test.status)}`,
                  borderRadius: '8px',
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong>{test.name}</strong>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      background: getStatusColor(test.status),
                      color: 'white',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {test.status.toUpperCase()}
                    {test.statusCode && ` (${test.statusCode})`}
                  </span>
                </div>
                <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{test.message}</p>
                {test.data && (
                  <details style={{ marginTop: '0.5rem' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#646cff' }}>
                      View Details
                    </summary>
                    <pre style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px', fontSize: '0.8rem', overflow: 'auto' }}>
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {diagnostics.error && (
            <div className="error-message">
              <strong>Diagnostic Error:</strong> {diagnostics.error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

