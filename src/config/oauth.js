// TrainingPeaks OAuth Configuration
const getRedirectUri = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin + '/callback'
  }
  // Fallback for SSR or initial load
  return 'http://localhost:5173/callback'
}

export const OAUTH_CONFIG = {
  clientId: 'brownlee-fitness',
  clientSecret: 'oWPKZfmjC1eg5wikNwtjyjKKh6caxWgYqyd31N2BX9Q',
  authorizationEndpoint: 'https://oauth.sandbox.trainingpeaks.com/oauth/authorize',
  tokenEndpoint: 'https://oauth.sandbox.trainingpeaks.com/oauth/token',
  get redirectUri() {
    return getRedirectUri()
  },
  scope: 'athlete:profile events:read events:write file:write metrics:read metrics:write workouts:read workouts:details workouts:wod workouts:plan',
  apiBaseUrl: 'https://api.sandbox.trainingpeaks.com',
  appUrl: 'https://app.sandbox.trainingpeaks.com',
}

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'tp_access_token',
  REFRESH_TOKEN: 'tp_refresh_token',
  TOKEN_EXPIRY: 'tp_token_expiry',
  CODE_VERIFIER: 'tp_code_verifier',
  STATE: 'tp_state',
}

