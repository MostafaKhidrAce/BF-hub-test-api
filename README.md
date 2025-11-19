# TrainingPeaks API Tester

A React + Vite application for testing and exploring the TrainingPeaks Partner API.

## Features

- 🔐 OAuth 2.0 authentication with PKCE (Proof Key for Code Exchange)
- 🔄 Automatic token refresh handling
- 🧪 Interactive testing UI for multiple API endpoints:
  - Athlete Profile
  - Workouts (list, details, WOD, plan)
  - Events (read, create)
  - Metrics (read, create/update)
- 🎨 Modern, responsive UI with dark mode support

## Prerequisites

- Node.js 18+ and npm
- TrainingPeaks sandbox account access
- OAuth credentials (provided by TrainingPeaks)

## Installation

1. Clone or download this repository
2. Install dependencies:
```bash
npm install
```

## Configuration

The OAuth credentials are already configured in `src/config/oauth.js`:
- Client ID: `brownlee-fitness`
- Sandbox endpoints are configured
- Redirect URI: `http://localhost:5173/callback` (or your dev server URL)

**Important:** Make sure your redirect URI matches what's registered with TrainingPeaks. For local development, use `http://localhost:5173/callback`.

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will start on `http://localhost:5173` (or the next available port).

### Production Build
```bash
npm run build
npm run preview
```

## Usage

1. **Start the development server**
2. **Click "Login with TrainingPeaks"** - You'll be redirected to TrainingPeaks sandbox
3. **Authorize the application** - Log in with your TrainingPeaks sandbox account
4. **Test API endpoints** - Use the UI components to test different API endpoints:
   - **Athlete Profile**: View your athlete profile information
   - **Workouts**: Test workout-related endpoints
   - **Events**: Test event creation and retrieval
   - **Metrics**: Test metric operations

## OAuth Flow

The application uses OAuth 2.0 Authorization Code Flow with PKCE:
1. User clicks login
2. App generates PKCE code challenge and state
3. User is redirected to TrainingPeaks for authorization
4. TrainingPeaks redirects back with authorization code
5. App exchanges code for access and refresh tokens
6. Tokens are stored securely in localStorage

## Token Management

- **Access tokens** expire after 1 hour (as per TrainingPeaks API)
- **Automatic refresh**: Tokens are automatically refreshed when they're about to expire (5-minute buffer)
- **Manual refresh**: Logout and login again if needed

## API Endpoints Tested

### Athlete Profile
- `GET /v3/athlete` - Get athlete profile

### Workouts
- `GET /v3/workouts` - List workouts
- `GET /v3/workouts/{id}` - Get workout details
- `GET /v3/workouts/wod` - Get workout of the day
- `GET /v3/workouts/plan` - Get workout plan

### Events
- `GET /v3/events` - List events
- `GET /v3/events/{id}` - Get event details
- `POST /v3/events` - Create event

### Metrics
- `GET /v3/metrics` - Get metrics
- `POST /v3/metrics` - Create/update metric

## Sandbox Environment

This application is configured to use the TrainingPeaks **sandbox environment**:
- OAuth: `https://oauth.sandbox.trainingpeaks.com`
- API: `https://api.sandbox.trainingpeaks.com`
- App: `https://app.sandbox.trainingpeaks.com`

**Important Notes:**
- Sandbox data is reset every Monday
- Test data uploaded during the week will be cleared on Monday
- Access tokens and grants are also reset on Monday

## Production Migration

When ready for production, update `src/config/oauth.js`:
- Remove `sandbox` from URLs:
  - `https://oauth.trainingpeaks.com`
  - `https://api.trainingpeaks.com`
- Ensure your redirect URI is registered with TrainingPeaks production

## Troubleshooting

### Authentication Issues
- **"State mismatch"**: Clear browser storage and try again
- **"Token exchange failed"**: Verify your client credentials are correct
- **"Redirect URI mismatch"**: Ensure the redirect URI matches exactly what's registered

### API Errors
- **401 Unauthorized**: Token may have expired - try logging out and back in
- **403 Forbidden**: Check that your account has the necessary permissions
- **404 Not Found**: Verify the endpoint URL is correct

### Common Issues
- Clear browser localStorage/sessionStorage if experiencing persistent auth issues
- Check browser console for detailed error messages
- Verify you're using the sandbox endpoints during testing

## Project Structure

```
src/
├── config/
│   └── oauth.js          # OAuth configuration
├── services/
│   ├── auth.js           # Authentication utilities
│   └── api.js            # API service functions
├── components/
│   ├── AuthButton.jsx    # Login/logout button
│   ├── AuthCallback.jsx  # OAuth callback handler
│   ├── AthleteProfile.jsx
│   ├── WorkoutsTest.jsx
│   ├── EventsTest.jsx
│   └── MetricsTest.jsx
├── App.jsx               # Main application component
└── main.jsx             # Application entry point
```

## Technologies Used

- React 19
- Vite 7
- React Router DOM
- OAuth 2.0 with PKCE
- Modern JavaScript (ES6+)

## License

This project is for testing and development purposes.
