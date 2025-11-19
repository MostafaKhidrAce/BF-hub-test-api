import { useState } from 'react'
import { eventsAPI } from '../services/api'

export default function EventsTest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])

  const handleGetEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      // getEvents now takes a date parameter (or defaults to today)
      const data = await eventsAPI.getEvents(eventDate)
      setResults({ type: 'events', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetNextEvent = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await eventsAPI.getNextEvent()
      setResults({ type: 'next-event', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async () => {
    // Example event data - adjust based on API requirements
    const eventData = {
      name: 'Test Event',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      description: 'This is a test event created via API',
    }
    
    setLoading(true)
    setError(null)
    try {
      const data = await eventsAPI.createEvent(eventData)
      setResults({ type: 'event-created', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="api-card">
      <div className="api-card-header">
        <h3>Events API</h3>
      </div>
      
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="api-actions">
        <div className="action-group">
          <button onClick={handleGetNextEvent} disabled={loading}>
            {loading ? 'Loading...' : 'Get Next Event'}
          </button>
        </div>
        
        <div className="action-group">
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            style={{ marginRight: '0.5rem', padding: '0.5rem' }}
          />
          <button onClick={handleGetEvents} disabled={loading}>
            {loading ? 'Loading...' : 'Get Events by Date'}
          </button>
        </div>
        
        <div className="action-group">
          <button onClick={handleCreateEvent} disabled={loading}>
            Create Test Event
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#888', margin: '0.5rem 0 0 0' }}>
          Format: v2/events/{'{'}date{'}'} or v2/events/next
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

