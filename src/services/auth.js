import { OAUTH_CONFIG, STORAGE_KEYS } from '../config/oauth'

// Generate random string for PKCE and state
function generateRandomString(length = 43) {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length)
}

// Generate code verifier and challenge for PKCE
export function generatePKCE() {
  const codeVerifier = generateRandomString(128)
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  
  return crypto.subtle.digest('SHA-256', data).then(hash => {
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    
    return { codeVerifier, codeChallenge }
  })
}

// Initiate OAuth login
export async function initiateLogin() {
  const state = generateRandomString()
  const { codeVerifier, codeChallenge } = await generatePKCE()
  
  // Store code verifier and state for later
  sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier)
  sessionStorage.setItem(STORAGE_KEYS.STATE, state)
  
  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    scope: OAUTH_CONFIG.scope,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  
  const authUrl = `${OAUTH_CONFIG.authorizationEndpoint}?${params.toString()}`
  window.location.href = authUrl
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(authCode, state) {
  const storedState = sessionStorage.getItem(STORAGE_KEYS.STATE)
  const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER)
  
  // Verify state
  if (state !== storedState) {
    throw new Error('State mismatch - possible CSRF attack')
  }
  
  // Clear stored state and code verifier
  sessionStorage.removeItem(STORAGE_KEYS.STATE)
  sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER)
  
  // Prepare token request
  const credentials = btoa(`${OAUTH_CONFIG.clientId}:${OAUTH_CONFIG.clientSecret}`)
  
  const response = await fetch(OAUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      code_verifier: codeVerifier,
    }),
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Token exchange failed' }))
    throw new Error(error.error_description || error.error || 'Failed to exchange code for tokens')
  }
  
  const tokenData = await response.json()
  
  // Store tokens
  const expiresAt = Date.now() + (tokenData.expires_in * 1000)
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token)
  if (tokenData.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refresh_token)
  }
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiresAt.toString())
  
  return tokenData
}

// Refresh access token
export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }
  
  const credentials = btoa(`${OAUTH_CONFIG.clientId}:${OAUTH_CONFIG.clientSecret}`)
  
  const response = await fetch(OAUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  
  if (!response.ok) {
    // If refresh fails, clear tokens and require re-authentication
    clearTokens()
    throw new Error('Token refresh failed - please re-authenticate')
  }
  
  const tokenData = await response.json()
  
  // Update stored tokens
  const expiresAt = Date.now() + (tokenData.expires_in * 1000)
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token)
  if (tokenData.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refresh_token)
  }
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiresAt.toString())
  
  return tokenData
}

// Get current access token (refreshes if needed)
export async function getValidAccessToken() {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  const tokenExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY)
  
  if (!accessToken) {
    throw new Error('No access token - please log in')
  }
  
  // Check if token is expired or will expire in the next 5 minutes
  const now = Date.now()
  const expiryTime = parseInt(tokenExpiry, 10)
  const buffer = 5 * 60 * 1000 // 5 minutes buffer
  
  if (now >= expiryTime - buffer) {
    // Token is expired or about to expire, refresh it
    await refreshAccessToken()
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  }
  
  return accessToken
}

// Check if user is authenticated
export function isAuthenticated() {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  const tokenExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY)
  
  if (!accessToken || !tokenExpiry) {
    return false
  }
  
  // Check if token is still valid
  const now = Date.now()
  const expiryTime = parseInt(tokenExpiry, 10)
  
  return now < expiryTime
}

// Logout - clear all tokens
export function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY)
  sessionStorage.removeItem(STORAGE_KEYS.STATE)
  sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER)
}

