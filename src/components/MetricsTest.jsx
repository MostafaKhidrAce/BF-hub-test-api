import { useState } from 'react'
import { metricsAPI } from '../services/api'

export default function MetricsTest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [metricValue, setMetricValue] = useState('75.5')
  const [metricType, setMetricType] = useState('WeightInKilograms')
  const [metricId, setMetricId] = useState('')
  const [metricsAthleteId, setMetricsAthleteId] = useState('')

  const handleGetMetrics = async () => {
    setLoading(true)
    setError(null)
    try {
      // getMetrics now requires startDate and endDate, or defaults to last 30 days
      const data = await metricsAPI.getMetrics(startDate, endDate)
      setResults({ type: 'metrics', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMetric = async () => {
    // Example metric data - using proper TrainingPeaks format
    // Required: DateTime (UTC), UploadClient, and at least one metric value
    const metricData = {
      DateTime: new Date().toISOString(), // UTC format
      UploadClient: 'TrainingPeaks API Tester',
      [metricType]: parseFloat(metricValue) || 75.5, // Use selected metric type
    }
    
    // If weight, use WeightInKilograms
    if (metricType === 'WeightInKilograms') {
      metricData.WeightInKilograms = parseFloat(metricValue) || 75.5
    } else if (metricType === 'Steps') {
      metricData.Steps = parseInt(metricValue) || 5000
    } else if (metricType === 'SleepHours') {
      metricData.SleepHours = parseFloat(metricValue) || 7.5
    }
    
    setLoading(true)
    setError(null)
    try {
      const data = await metricsAPI.upsertMetric(metricData)
      setResults({ type: 'metric-created', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="api-card">
      <div className="api-card-header">
        <h3>Metrics API</h3>
      </div>
      
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="api-actions">
        <div className="action-group" style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>Get Metrics (Date Range):</label>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ flex: 1, padding: '0.5rem' }}
            />
            <span style={{ alignSelf: 'center' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ flex: 1, padding: '0.5rem' }}
            />
            <button onClick={handleGetMetrics} disabled={loading}>
              {loading ? 'Loading...' : 'Get Metrics'}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>
            Format: v2/metrics/{'{'}startDate{'}'}/{'{'}'endDate{'}'}
          </p>
        </div>
        
        <div className="action-group" style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start', marginTop: '1rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>Create Metric:</label>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value="WeightInKilograms">Weight (kg)</option>
              <option value="Steps">Steps</option>
              <option value="SleepHours">Sleep Hours</option>
              <option value="Pulse">Pulse (BPM)</option>
              <option value="HRV">HRV</option>
            </select>
            <input
              type="number"
              value={metricValue}
              onChange={(e) => setMetricValue(e.target.value)}
              placeholder="Value"
              style={{ flex: 1, padding: '0.5rem' }}
            />
            <button onClick={handleCreateMetric} disabled={loading}>
              {loading ? 'Creating...' : 'Create Metric'}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>
            Required: DateTime (UTC), UploadClient, and at least one metric value
          </p>
        </div>

        <div className="action-group" style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start', marginTop: '1rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>Get Metric by ID:</label>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <input
              type="text"
              placeholder="Metric ID"
              value={metricId}
              onChange={(e) => setMetricId(e.target.value)}
              style={{ flex: 1, padding: '0.5rem' }}
            />
            <button 
              onClick={async () => {
                if (!metricId.trim()) {
                  setError('Please enter a metric ID')
                  return
                }
                setLoading(true)
                setError(null)
                try {
                  const data = await metricsAPI.getMetricById(metricId.trim())
                  setResults({ type: 'metric-by-id', data })
                } catch (err) {
                  setError(err.message)
                } finally {
                  setLoading(false)
                }
              }} 
              disabled={loading}
            >
              Get by ID
            </button>
          </div>
        </div>

        <div className="action-group" style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start', marginTop: '1rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>Get Metrics by Athlete (for coaches):</label>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <input
              type="text"
              placeholder="Athlete ID"
              value={metricsAthleteId}
              onChange={(e) => setMetricsAthleteId(e.target.value)}
              style={{ padding: '0.5rem' }}
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ flex: 1, padding: '0.5rem' }}
            />
            <span style={{ alignSelf: 'center' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ flex: 1, padding: '0.5rem' }}
            />
            <button 
              onClick={async () => {
                if (!metricsAthleteId.trim()) {
                  setError('Please enter an athlete ID')
                  return
                }
                setLoading(true)
                setError(null)
                try {
                  const data = await metricsAPI.getMetricsByAthlete(metricsAthleteId.trim(), startDate, endDate)
                  setResults({ type: 'metrics-by-athlete', data })
                } catch (err) {
                  setError(err.message)
                } finally {
                  setLoading(false)
                }
              }} 
              disabled={loading}
            >
              Get
            </button>
          </div>
        </div>
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

