import { useState } from 'react'
import { workoutsAPI } from '../services/api'

export default function WorkoutsTest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [workoutId, setWorkoutId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [changedDate, setChangedDate] = useState(new Date().toISOString().split('T')[0])
  const [athleteId, setAthleteId] = useState('')

  const handleGetWorkouts = async () => {
    setLoading(true)
    setError(null)
    try {
      // getWorkouts now requires startDate and endDate, or defaults to last 30 days
      const data = await workoutsAPI.getWorkouts(startDate, endDate)
      setResults({ type: 'workouts', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetWorkoutDetails = async () => {
    if (!workoutId.trim()) {
      setError('Please enter a workout ID')
      return
    }
    setLoading(true)
    setError(null)
    try {
      // Workout IDs are typically large 64-bit integers (e.g., 139283664)
      // Make sure you're using a valid workout ID from your workouts list
      const data = await workoutsAPI.getWorkoutDetails(workoutId.trim())
      setResults({ type: 'workout-details', data })
    } catch (err) {
      // Provide more helpful error message for 403
      if (err.status === 403 || err.message.includes('403')) {
        setError(`403 Forbidden: Workout ID ${workoutId} may not exist or doesn't belong to your account. Try getting workouts first to see valid IDs. Error: ${err.message}`)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Helper function to extract workout IDs from the workouts list
  const extractWorkoutIds = () => {
    if (results && results.type === 'workouts' && Array.isArray(results.data)) {
      const ids = results.data.map(workout => workout.Id).filter(id => id !== undefined)
      if (ids.length > 0) {
        return ids.slice(0, 5) // Return first 5 IDs as examples
      }
    }
    return null
  }
  
  const workoutIds = extractWorkoutIds()

  const handleGetWOD = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await workoutsAPI.getWOD(date)
      setResults({ type: 'wod', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetPlan = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await workoutsAPI.getWorkoutPlan()
      setResults({ type: 'plan', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetChangedWorkouts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await workoutsAPI.getChangedWorkouts(changedDate)
      setResults({ type: 'changed-workouts', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetMeanMaxes = async () => {
    if (!workoutId.trim()) {
      setError('Please enter a workout ID')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await workoutsAPI.getWorkoutMeanMaxes(workoutId.trim(), athleteId.trim() || null)
      setResults({ type: 'meanmaxes', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetTimeInZones = async () => {
    if (!workoutId.trim()) {
      setError('Please enter a workout ID')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await workoutsAPI.getWorkoutTimeInZones(workoutId.trim(), athleteId.trim() || null)
      setResults({ type: 'timeinzones', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetDetails = async () => {
    if (!workoutId.trim()) {
      setError('Please enter a workout ID')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await workoutsAPI.getWorkoutDetailsFull(workoutId.trim(), athleteId.trim() || null)
      setResults({ type: 'workout-details-full', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorkout = async () => {
    if (!workoutId.trim()) {
      setError('Please enter a workout ID')
      return
    }
    if (!confirm(`Are you sure you want to delete workout ${workoutId}?`)) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      await workoutsAPI.deleteWorkout(workoutId.trim(), athleteId.trim() || null)
      setResults({ type: 'workout-deleted', data: { message: `Workout ${workoutId} deleted successfully` } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="api-card">
      <div className="api-card-header">
        <h3>Workouts API</h3>
      </div>
      
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="api-actions">
        <div className="action-group" style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>Date Range (required):</label>
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
            <button onClick={handleGetWorkouts} disabled={loading}>
              {loading ? 'Loading...' : 'Get Workouts'}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>
            Format: v2/workouts/{'{'}startDate{'}'}/{'{'}'endDate{'}'}
          </p>
        </div>
        
        <div className="action-group" style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', width: '100%', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Workout ID (e.g., 139283664)"
              value={workoutId}
              onChange={(e) => setWorkoutId(e.target.value)}
              style={{ flex: 1, padding: '0.5rem' }}
            />
            <button onClick={handleGetWorkoutDetails} disabled={loading}>
              Get Workout Details
            </button>
          </div>
          {workoutIds && workoutIds.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: '#888' }}>
              <strong>Tip:</strong> Click on a workout ID from the list above: {' '}
              {workoutIds.map((id, idx) => (
                <span key={id}>
                  <button
                    onClick={() => setWorkoutId(id.toString())}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      margin: '0 0.25rem',
                      background: '#646cff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {id}
                  </button>
                  {idx < workoutIds.length - 1 && ', '}
                </span>
              ))}
            </div>
          )}
          <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>
            Format: v2/workouts/id/{'{'}workoutId{'}'}
          </p>
        </div>
        
        <div className="action-group">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ marginRight: '0.5rem', padding: '0.5rem' }}
          />
          <button onClick={handleGetWOD} disabled={loading}>
            Get WOD (Workout of the Day)
          </button>
        </div>
        
        <div className="action-group">
          <input
            type="date"
            value={changedDate}
            onChange={(e) => setChangedDate(e.target.value)}
            style={{ marginRight: '0.5rem', padding: '0.5rem' }}
          />
          <button onClick={handleGetChangedWorkouts} disabled={loading}>
            Get Changed Workouts
          </button>
        </div>

        <div className="action-group" style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>Advanced Workout Operations (optional Athlete ID for coaches):</label>
          <div style={{ display: 'flex', width: '100%', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              placeholder="Athlete ID (optional, for coaches)"
              value={athleteId}
              onChange={(e) => setAthleteId(e.target.value)}
              style={{ flex: 1, padding: '0.5rem' }}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
            <button 
              onClick={handleGetMeanMaxes} 
              disabled={loading || !workoutId.trim()}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Get Mean Maxes
            </button>
            <button 
              onClick={handleGetTimeInZones} 
              disabled={loading || !workoutId.trim()}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Get Time in Zones
            </button>
            <button 
              onClick={handleGetDetails} 
              disabled={loading || !workoutId.trim()}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Get Full Details
            </button>
            <button 
              onClick={handleDeleteWorkout} 
              disabled={loading || !workoutId.trim()}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: '#dc3545' }}
            >
              Delete Workout
            </button>
          </div>
        </div>

        <div className="action-group">
          <button onClick={handleGetPlan} disabled={loading}>
            Get Workout Plan
          </button>
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

