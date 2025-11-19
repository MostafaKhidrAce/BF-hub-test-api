import { useState } from 'react'
import { webhookAPI } from '../services/api'

export default function WebhooksTest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [subscriptionId, setSubscriptionId] = useState('')
  const [url, setUrl] = useState('https://example.com/webhook')

  const handleGetSubscriptions = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await webhookAPI.getSubscriptions()
      setResults({ type: 'subscriptions', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubscription = async () => {
    if (!url.trim()) {
      setError('Please enter a webhook URL')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const subscriptionData = {
        Url: url.trim(),
        // Add other required fields based on API docs
      }
      const data = await webhookAPI.createSubscription(subscriptionData)
      setResults({ type: 'subscription-created', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSubscription = async () => {
    if (!subscriptionId.trim()) {
      setError('Please enter a subscription ID')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const subscriptionData = {
        Url: url.trim(),
        // Add other fields to update
      }
      const data = await webhookAPI.updateSubscription(subscriptionId.trim(), subscriptionData)
      setResults({ type: 'subscription-updated', data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubscription = async () => {
    if (!subscriptionId.trim()) {
      setError('Please enter a subscription ID')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await webhookAPI.deleteSubscription(subscriptionId.trim())
      setResults({ type: 'subscription-deleted', data: { message: 'Subscription deleted successfully' } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="api-card">
      <div className="api-card-header">
        <h3>Webhooks API (Early Access)</h3>
      </div>
      
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="api-actions">
        <div className="action-group">
          <button onClick={handleGetSubscriptions} disabled={loading}>
            {loading ? 'Loading...' : 'Get Subscriptions'}
          </button>
        </div>
        
        <div className="action-group" style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>Create Subscription:</label>
          <div style={{ display: 'flex', width: '100%', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Webhook URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ flex: 1, padding: '0.5rem' }}
            />
            <button onClick={handleCreateSubscription} disabled={loading}>
              Create
            </button>
          </div>
        </div>
        
        <div className="action-group" style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>Update/Delete Subscription:</label>
          <div style={{ display: 'flex', width: '100%', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Subscription ID"
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
              style={{ flex: 1, padding: '0.5rem' }}
            />
            <button onClick={handleUpdateSubscription} disabled={loading}>
              Update
            </button>
            <button 
              onClick={handleDeleteSubscription} 
              disabled={loading}
              style={{ background: '#dc3545' }}
            >
              Delete
            </button>
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#888', margin: '0.5rem 0 0 0' }}>
          Note: Requires webhook:read-subscriptions and webhook:write-subscriptions scopes
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


