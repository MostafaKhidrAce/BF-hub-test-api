import { useState, useEffect } from 'react'
import { athleteAPI } from '../services/api'

export default function AthleteProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await athleteAPI.getProfile()
      setProfile(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return (
    <div className="api-card">
      <div className="api-card-header">
        <h3>Athlete Profile</h3>
        <button onClick={fetchProfile} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {loading && !profile && (
        <div className="loading">Loading profile...</div>
      )}
      
      {profile && (
        <div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem', 
            marginBottom: '1rem',
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div>
              <strong style={{ color: '#666', fontSize: '0.85rem' }}>Name</strong>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: '500' }}>
                {profile.FirstName} {profile.LastName}
              </p>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: '0.85rem' }}>Email</strong>
              <p style={{ margin: '0.25rem 0 0 0' }}>{profile.Email}</p>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: '0.85rem' }}>Athlete ID</strong>
              <p style={{ margin: '0.25rem 0 0 0' }}>{profile.Id}</p>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: '0.85rem' }}>Time Zone</strong>
              <p style={{ margin: '0.25rem 0 0 0' }}>{profile.TimeZone}</p>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: '0.85rem' }}>Sex</strong>
              <p style={{ margin: '0.25rem 0 0 0' }}>{profile.Sex === 'm' ? 'Male' : profile.Sex === 'f' ? 'Female' : profile.Sex}</p>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: '0.85rem' }}>Birth Month</strong>
              <p style={{ margin: '0.25rem 0 0 0' }}>{profile.BirthMonth || 'Not specified'}</p>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: '0.85rem' }}>Weight</strong>
              <p style={{ margin: '0.25rem 0 0 0' }}>{profile.Weight || 'Not specified'}</p>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: '0.85rem' }}>Units</strong>
              <p style={{ margin: '0.25rem 0 0 0' }}>{profile.PreferredUnits}</p>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: '0.85rem' }}>Premium</strong>
              <p style={{ margin: '0.25rem 0 0 0' }}>
                {profile.IsPremium ? '✅ Yes' : '❌ No'}
              </p>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: '0.85rem' }}>Coached By</strong>
              <p style={{ margin: '0.25rem 0 0 0' }}>{profile.CoachedBy || 'None'}</p>
            </div>
          </div>
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', color: '#646cff', fontWeight: '500' }}>
              View Raw JSON Response
            </summary>
            <div className="api-response" style={{ marginTop: '0.5rem' }}>
              <pre>{JSON.stringify(profile, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

