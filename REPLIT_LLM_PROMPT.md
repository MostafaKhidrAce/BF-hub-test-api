# TrainingPeaks API Integration - Detailed Implementation Prompt

## Project Overview

You are implementing two features for a TrainingPeaks API integration application:
1. **Training Calendar Component** - Displays daily workout schedules with week navigation
2. **Coach Dashboard Component** - Shows coach overview with community metrics, squad numbers, and action priorities

**IMPORTANT**: Focus ONLY on API integration, data fetching, and business logic. DO NOT implement UI/styling components. Return raw data structures and API response handlers.

---

## API Configuration & Base URLs

### Base Configuration

The application uses TrainingPeaks Partner API (Sandbox Environment):

**Base API URL**: `https://api.sandbox.trainingpeaks.com`

**OAuth Configuration**:
- **Authorization Endpoint**: `https://oauth.sandbox.trainingpeaks.com/oauth/authorize`
- **Token Endpoint**: `https://oauth.sandbox.trainingpeaks.com/oauth/token`
- **Client ID**: `brownlee-fitness`
- **Client Secret**: `oWPKZfmjC1eg5wikNwtjyjKKh6caxWgYqyd31N2BX9Q`

**Required OAuth Scopes**:
```
athlete:profile events:read events:write file:write metrics:read metrics:write workouts:read workouts:details workouts:wod workouts:plan coach:athletes
```

### Authentication Flow

All API requests require OAuth 2.0 Bearer token authentication:

1. **Get Access Token**: Use `getValidAccessToken()` function (handles token refresh automatically)
2. **Request Headers**: Every API request must include:
   ```
   Authorization: Bearer {access_token}
   Content-Type: application/json
   Accept: application/json
   User-Agent: TrainingPeaks API Tester/1.0
   ```

3. **Token Storage**: Access tokens are stored in `localStorage` with key `tp_access_token`
4. **Token Refresh**: Tokens auto-refresh when expired (handled by `getValidAccessToken()`)

---

## API Request Helper Function

Create a reusable API request function that handles authentication:

```javascript
// Import from config
import { OAUTH_CONFIG } from '../config/oauth';
import { getValidAccessToken } from './auth';

async function apiRequest(endpoint, options = {}) {
  // Get valid access token (auto-refreshes if needed)
  const accessToken = await getValidAccessToken();
  
  // Construct full URL
  const url = `${OAUTH_CONFIG.apiBaseUrl}${endpoint}`;
  
  // Make request with authentication headers
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'TrainingPeaks API Tester/1.0',
      ...options.headers,
    },
  });
  
  // Handle errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const error = new Error(errorData?.error_description || errorData?.error || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  
  return await response.json();
}
```

---

## Feature 1: Training Calendar API Integration

### Purpose
Fetch and display workouts for a specific day with week navigation capability.

### APIs Used

#### 1. Get Workouts by Date Range
**Endpoint**: `GET /v2/workouts/{startDate}/{endDate}`

**Full URL**: `https://api.sandbox.trainingpeaks.com/v2/workouts/{startDate}/{endDate}`

**Parameters**:
- `startDate` (path parameter, required): Start date in `YYYY-MM-DD` format
- `endDate` (path parameter, required): End date in `YYYY-MM-DD` format

**Example Request**:
```javascript
// Get workouts for a week (Monday to Sunday)
const startDate = '2024-01-01'; // Monday
const endDate = '2024-01-07';   // Sunday
const workouts = await apiRequest(`/v2/workouts/${startDate}/${endDate}`);
```

**Response Structure**:
```json
[
  {
    "Id": 123456789,
    "WorkoutName": "Morning Run",
    "Name": "Morning Run",
    "StartDate": "2024-01-01T07:00:00Z",
    "EndDate": "2024-01-01T07:45:00Z",
    "Duration": 2700,
    "IsCompleted": true,
    "CompletedDate": "2024-01-01T07:45:00Z",
    "Status": "Completed",
    "HasActualData": true,
    "WorkoutType": "Run"
  },
  {
    "Id": 123456790,
    "WorkoutName": "Core Strength",
    "StartDate": "2024-01-01T18:00:00Z",
    "EndDate": "2024-01-01T18:20:00Z",
    "Duration": 1200,
    "IsCompleted": false,
    "Status": "Planned"
  }
]
```

**Implementation Requirements**:
1. Calculate week range (Monday to Sunday) for the selected date
2. Format dates as `YYYY-MM-DD` before making API call
3. Filter workouts by selected day (compare `StartDate` with selected date)
4. Extract workout details:
   - **Time**: Parse `StartDate` and format as `HH:MM` (24-hour format)
   - **Duration**: Convert `Duration` (seconds) to minutes, or calculate from `StartDate` and `EndDate`
   - **Completion Status**: Check `IsCompleted`, `CompletedDate`, `Status === "Completed"`, or `HasActualData`
   - **Workout Name**: Use `WorkoutName` or `Name` field

**Date Calculation Logic**:
```javascript
// Get start of week (Monday) for a given date
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get end of week (Sunday)
function getWeekEnd(startDate) {
  const end = new Date(startDate);
  end.setDate(startDate.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

// Format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}
```

**Data Processing**:
```javascript
// Filter workouts for a specific day
function getDayWorkouts(workouts, selectedDate) {
  const selectedDateStr = formatDate(selectedDate);
  return workouts.filter(workout => {
    if (!workout.StartDate) return false;
    const workoutDate = new Date(workout.StartDate);
    return formatDate(workoutDate) === selectedDateStr;
  });
}

// Format workout time
function formatWorkoutTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
}

// Get workout duration in minutes
function getWorkoutDuration(workout) {
  if (workout.Duration && typeof workout.Duration === 'number') {
    return Math.round(workout.Duration / 60); // Convert seconds to minutes
  }
  if (workout.StartDate && workout.EndDate) {
    const start = new Date(workout.StartDate);
    const end = new Date(workout.EndDate);
    return Math.round((end - start) / 60000); // Convert milliseconds to minutes
  }
  return null;
}

// Check if workout is completed
function isWorkoutCompleted(workout) {
  if (workout.IsCompleted !== undefined) return workout.IsCompleted;
  if (workout.CompletedDate) return true;
  if (workout.Status === 'Completed' || workout.Status === 'Done') return true;
  if (workout.HasActualData) return true;
  return false;
}
```

---

## Feature 2: Coach Dashboard API Integration

### Purpose
Fetch coach data, athlete information, and workout metrics to calculate community engagement and action priorities.

### APIs Used

#### 1. Get Coach Athletes
**Endpoint**: `GET /v1/coach/athletes`

**Full URL**: `https://api.sandbox.trainingpeaks.com/v1/coach/athletes`

**Required Scope**: `coach:athletes`

**Example Request**:
```javascript
const athletes = await apiRequest('/v1/coach/athletes');
```

**Response Structure**:
```json
[
  {
    "Id": 123456,
    "FirstName": "John",
    "LastName": "Doe",
    "Email": "john.doe@gmail.com",
    "TimeZone": "America/Denver",
    "BirthMonth": "1980-10",
    "Sex": "m",
    "CoachedBy": 987654,
    "Weight": 87.5223617553711,
    "IsPremium": true,
    "PreferredUnits": "English"
  },
  {
    "Id": 123457,
    "FirstName": "Jane",
    "LastName": "Smith",
    "Email": "jane.smith@yahoo.com",
    "BirthMonth": null,
    "Sex": "f",
    "CoachedBy": 987653,
    "IsPremium": false,
    "PreferredUnits": "Metric"
  }
]
```

**Implementation Requirements**:
- Returns array of athlete objects
- Use `Id` field to fetch individual athlete workouts
- Calculate squad numbers: total athletes = array length

---

#### 2. Get Workouts by Athlete and Date Range
**Endpoint**: `GET /v2/workouts/{athleteId}/{startDate}/{endDate}`

**Full URL**: `https://api.sandbox.trainingpeaks.com/v2/workouts/{athleteId}/{startDate}/{endDate}`

**Parameters**:
- `athleteId` (path parameter, required): Athlete ID from coach athletes response
- `startDate` (path parameter, required): Start date in `YYYY-MM-DD` format
- `endDate` (path parameter, required): End date in `YYYY-MM-DD` format

**Example Request**:
```javascript
// Get workouts for a specific athlete over the last 7 days
const athleteId = 123456;
const today = new Date();
const sevenDaysAgo = new Date(today);
sevenDaysAgo.setDate(today.getDate() - 7);
const startDate = formatDate(sevenDaysAgo); // YYYY-MM-DD
const endDate = formatDate(today); // YYYY-MM-DD

const workouts = await apiRequest(`/v2/workouts/${athleteId}/${startDate}/${endDate}`);
```

**Response Structure**: Same as workouts endpoint (array of workout objects)

**Implementation Requirements**:
1. Fetch workouts for each athlete in parallel
2. Use date range: last 7 days from today
3. Handle errors gracefully (some athletes may have no workouts or API errors)
4. Store workouts in a map: `{ [athleteId]: [workouts] }`

**Parallel Fetching Pattern**:
```javascript
const today = new Date();
const sevenDaysAgo = new Date(today);
sevenDaysAgo.setDate(today.getDate() - 7);
const startDate = formatDate(sevenDaysAgo);
const endDate = formatDate(today);

// Fetch workouts for all athletes in parallel
const workoutPromises = athletesList.map(async (athlete) => {
  try {
    const workouts = await apiRequest(
      `/v2/workouts/${athlete.Id}/${startDate}/${endDate}`
    );
    return {
      athleteId: athlete.Id,
      workouts: Array.isArray(workouts) ? workouts : []
    };
  } catch (error) {
    // Handle errors gracefully - return empty array for this athlete
    console.error(`Error fetching workouts for athlete ${athlete.Id}:`, error);
    return { athleteId: athlete.Id, workouts: [] };
  }
});

const workoutResults = await Promise.all(workoutPromises);

// Convert to map for easy lookup
const workoutsMap = {};
workoutResults.forEach(result => {
  workoutsMap[result.athleteId] = result.workouts;
});
```

---

### Metrics Calculation Logic

#### Community Pulse Calculation

Calculate sentiment percentages based on workout completion rates:

```javascript
function calculateCommunityPulse(athletesList, workoutsMap) {
  let totalWorkouts = 0;
  let completedWorkouts = 0;

  athletesList.forEach(athlete => {
    const workouts = workoutsMap[athlete.Id] || [];
    totalWorkouts += workouts.length;
    
    const completed = workouts.filter(w => {
      if (w.IsCompleted !== undefined) return w.IsCompleted;
      if (w.CompletedDate) return true;
      if (w.Status === 'Completed' || w.Status === 'Done') return true;
      return false;
    }).length;
    
    completedWorkouts += completed;
  });

  const completionRate = totalWorkouts > 0 ? completedWorkouts / totalWorkouts : 1;
  
  let positive, neutral, negative;
  
  if (completionRate >= 0.7) {
    // High engagement
    positive = Math.round(completionRate * 100);
    neutral = Math.round((1 - completionRate) * 50);
    negative = 100 - positive - neutral;
  } else if (completionRate >= 0.4) {
    // Moderate engagement
    neutral = Math.round(completionRate * 50);
    positive = Math.round((1 - completionRate) * 30);
    negative = 100 - positive - neutral;
  } else {
    // Low engagement
    negative = Math.round((1 - completionRate) * 100);
    neutral = Math.round(completionRate * 30);
    positive = 100 - negative - neutral;
  }

  return { positive, neutral, negative };
}
```

#### Action Priorities Calculation

Identify priority areas based on workout patterns:

```javascript
function calculateActionPriorities(athletesList, workoutsMap) {
  const priorities = [];
  const athleteIssues = {};

  // Analyze each athlete's workout patterns
  athletesList.forEach(athlete => {
    const workouts = workoutsMap[athlete.Id] || [];
    const scheduled = workouts.length;
    
    const completed = workouts.filter(w => {
      if (w.IsCompleted !== undefined) return w.IsCompleted;
      if (w.CompletedDate) return true;
      if (w.Status === 'Completed' || w.Status === 'Done') return true;
      return false;
    }).length;
    
    const completionRate = scheduled > 0 ? completed / scheduled : 1;
    
    // Categorize issues
    if (scheduled === 0) {
      athleteIssues[athlete.Id] = { type: 'no-workouts', athlete };
    } else if (completionRate < 0.5) {
      athleteIssues[athlete.Id] = { 
        type: 'low-completion', 
        athlete, 
        rate: completionRate 
      };
    }
  });

  // Priority 1: Injury & Recovery (very low completion rate < 30%)
  const injuryCount = Object.values(athleteIssues).filter(
    issue => issue.type === 'low-completion' && issue.rate < 0.3
  ).length;
  if (injuryCount > 0) {
    priorities.push({
      rank: 1,
      title: 'Injury & Recovery',
      action: 'Host webinar on injury prevention or recovery strategies',
      count: injuryCount,
      trend: 'up'
    });
  }

  // Priority 2: Requests for Guidance (no workouts scheduled)
  const guidanceCount = Object.values(athleteIssues).filter(
    issue => issue.type === 'no-workouts'
  ).length;
  if (guidanceCount > 0) {
    priorities.push({
      rank: priorities.length + 1,
      title: 'Requests for Guidance',
      action: 'Create Q&A post, webinar, or educational content series',
      count: guidanceCount,
      trend: 'up'
    });
  }

  // Priority 3: Race Preparation (high training load > 5 workouts)
  const racePrepCount = athletesList.filter(athlete => {
    const workouts = workoutsMap[athlete.Id] || [];
    return workouts.length > 5;
  }).length;
  if (racePrepCount > 0) {
    priorities.push({
      rank: priorities.length + 1,
      title: 'Race Preparation',
      action: 'Publish race-day strategy guide or host prep session',
      count: racePrepCount,
      trend: 'up'
    });
  }

  // Priority 4: Training Challenges (moderate completion rate 30-50%)
  const challengeCount = Object.values(athleteIssues).filter(
    issue => issue.type === 'low-completion' && 
             issue.rate >= 0.3 && 
             issue.rate < 0.5
  ).length;
  if (challengeCount > 0) {
    priorities.push({
      rank: priorities.length + 1,
      title: 'Training Challenges',
      action: 'Consider recovery content, motivation boost sessions, or periodization guidance',
      count: challengeCount,
      trend: 'up'
    });
  }

  // Priority 5: Nutrition (always include if less than 5 priorities)
  if (priorities.length < 5) {
    priorities.push({
      rank: priorities.length + 1,
      title: 'Nutrition & Fuelling',
      action: 'Share nutrition guide, recipe post, or fuelling Q&A',
      count: 1,
      trend: 'up'
    });
  }

  return priorities.slice(0, 5); // Return top 5
}
```

#### Squad Numbers Calculation

```javascript
function calculateSquadNumbers(athletesList) {
  return {
    total: athletesList.length,
    joiners: 0,      // Would require historical data
    leavers: 0,      // Would require historical data
    net: 0,          // joiners - leavers
    awaiting: 0      // Would require invitation data
  };
}
```

---

## Error Handling

### Common Error Scenarios

1. **401 Unauthorized**:
   - Missing or invalid access token
   - Token expired (should auto-refresh)
   - Missing required scope (e.g., `coach:athletes`)
   - Account is not a coach account (for coach endpoints)

2. **403 Forbidden**:
   - Token doesn't have required permissions
   - Trying to access another user's data

3. **404 Not Found**:
   - Invalid endpoint URL
   - Athlete ID doesn't exist

4. **Rate Limiting**:
   - Too many requests (implement retry logic with exponential backoff)

### Error Handling Pattern

```javascript
try {
  const data = await apiRequest('/v1/coach/athletes');
  // Process data
} catch (error) {
  if (error.status === 401) {
    // Handle authentication error
    if (error.message.includes('coach:athletes')) {
      throw new Error('Missing coach:athletes scope. Please re-authenticate.');
    }
    throw new Error('Authentication required. Please log in.');
  } else if (error.status === 403) {
    throw new Error('Access forbidden. Check account permissions.');
  } else if (error.status === 404) {
    throw new Error('Resource not found.');
  } else {
    throw error;
  }
}
```

---

## Implementation Checklist

### Training Calendar Component

- [ ] Create function to calculate week range (Monday to Sunday)
- [ ] Create function to format dates as YYYY-MM-DD
- [ ] Implement API call to `/v2/workouts/{startDate}/{endDate}`
- [ ] Filter workouts by selected day
- [ ] Extract and format workout time (HH:MM)
- [ ] Calculate workout duration in minutes
- [ ] Determine workout completion status
- [ ] Handle date navigation (previous/next day)
- [ ] Handle API errors gracefully

### Coach Dashboard Component

- [ ] Implement API call to `/v1/coach/athletes`
- [ ] Calculate squad numbers from athletes list
- [ ] Fetch workouts for each athlete using `/v2/workouts/{athleteId}/{startDate}/{endDate}`
- [ ] Implement parallel fetching for all athletes
- [ ] Calculate community pulse metrics
- [ ] Calculate action priorities
- [ ] Handle errors for individual athlete workout fetches
- [ ] Return structured data object with all metrics

---

## Data Structures to Return

### Training Calendar Data Structure

```javascript
{
  selectedDate: Date,
  workouts: [
    {
      id: number,
      name: string,
      time: string,        // "07:00"
      duration: number,    // minutes
      isCompleted: boolean,
      startDate: string,   // ISO date string
      endDate: string      // ISO date string
    }
  ],
  loading: boolean,
  error: string | null
}
```

### Coach Dashboard Data Structure

```javascript
{
  loading: boolean,
  error: string | null,
  metrics: {
    communityPulse: {
      positive: number,    // percentage
      neutral: number,     // percentage
      negative: number    // percentage
    },
    priorities: [
      {
        rank: number,
        title: string,
        action: string,
        count: number,
        trend: string
      }
    ],
    squadNumbers: {
      total: number,
      joiners: number,
      leavers: number,
      net: number,
      awaiting: number
    }
  }
}
```

---

## Important Notes

1. **Date Formatting**: Always use `YYYY-MM-DD` format for API date parameters
2. **Time Zones**: API returns dates in UTC. Convert to local timezone for display
3. **Array Handling**: API responses may be arrays or single objects. Always check and normalize
4. **Error Recovery**: Implement graceful error handling - don't fail entire operation if one athlete's data fails
5. **Performance**: Use `Promise.all()` for parallel API calls when fetching multiple athletes' data
6. **Token Management**: Always use `getValidAccessToken()` - it handles token refresh automatically
7. **Scope Requirements**: Coach endpoints require `coach:athletes` scope in OAuth configuration

---

## Testing Recommendations

1. Test with empty athlete list
2. Test with athletes that have no workouts
3. Test with athletes that have completed workouts
4. Test with athletes that have incomplete workouts
5. Test date edge cases (week boundaries, month boundaries)
6. Test error scenarios (401, 403, 404, network errors)
7. Test token expiration and refresh

---

## API Endpoints Summary

| Feature | Endpoint | Method | Scope Required | Purpose |
|---------|----------|--------|----------------|---------|
| Training Calendar | `/v2/workouts/{startDate}/{endDate}` | GET | `workouts:read` | Get workouts for date range |
| Coach Dashboard | `/v1/coach/athletes` | GET | `coach:athletes` | Get list of coach's athletes |
| Coach Dashboard | `/v2/workouts/{athleteId}/{startDate}/{endDate}` | GET | `coach:athletes`, `workouts:read` | Get workouts for specific athlete |

---

**END OF PROMPT**

