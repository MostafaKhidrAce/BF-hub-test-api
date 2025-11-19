import { OAUTH_CONFIG } from "../config/oauth";
import { getValidAccessToken } from "./auth";

// Create API request with authentication
async function apiRequest(endpoint, options = {}) {
  try {
    const accessToken = await getValidAccessToken();

    const response = await fetch(`${OAUTH_CONFIG.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "TrainingPeaks API Tester/1.0",
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Try to parse error response
      let errorData;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json().catch(() => null);
      } else {
        // If HTML response (like 404 pages), get text
        const text = await response.text().catch(() => "");
        errorData = {
          error: `HTTP ${response.status}: ${response.statusText}`,
          raw: text.substring(0, 200),
        };
      }

      // Handle array of error messages (TrainingPeaks sometimes returns arrays)
      let errorMessage;
      if (Array.isArray(errorData)) {
        errorMessage = errorData.join(", ");
      } else if (errorData?.error_description) {
        errorMessage = errorData.error_description;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (typeof errorData === "string") {
        errorMessage = errorData;
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      const fullError = new Error(errorMessage);
      fullError.status = response.status;
      fullError.endpoint = endpoint;
      throw fullError;
    }

    return await response.json();
  } catch (error) {
    if (error.message.includes("No access token")) {
      throw new Error("Authentication required. Please log in.");
    }
    throw error;
  }
}

// Info API
export const infoAPI = {
  // Get API version info
  // Endpoint: GET /v1/info/version
  getVersion: async () => {
    return apiRequest("/v1/info/version");
  },
};

// Athlete Profile API
export const athleteAPI = {
  // Get athlete profile
  // Endpoint: GET /v1/athlete/profile
  getProfile: async () => {
    return apiRequest("/v1/athlete/profile");
  },

  // Get athlete zones
  // Endpoint: GET /v1/athlete/profile/zones
  getZones: async () => {
    return apiRequest("/v1/athlete/profile/zones");
  },

  // Get athlete zones by type
  // Endpoint: GET /v1/athlete/profile/zones/{zone_type} (from docs)
  // Alternative: GET /v1/athlete/zones/{zone_type} (from endpoints list)
  // Valid zone types: heartrate, speed, power
  getZonesByType: async (zoneType) => {
    if (!zoneType) {
      throw new Error(
        "Zone type is required. Valid types: heartrate, speed, power"
      );
    }
    const validTypes = ["heartrate", "speed", "power"];
    if (!validTypes.includes(zoneType.toLowerCase())) {
      throw new Error(
        `Invalid zone type. Valid types are: ${validTypes.join(", ")}`
      );
    }
    // Try /v1/athlete/profile/zones/{type} first (as shown in detailed docs)
    try {
      return await apiRequest(
        `/v1/athlete/profile/zones/${zoneType.toLowerCase()}`
      );
    } catch (error) {
      // Fallback to /v1/athlete/zones/{type} if the first doesn't work
      if (error.status === 404 || error.message.includes("404")) {
        return apiRequest(`/v1/athlete/zones/${zoneType.toLowerCase()}`);
      }
      throw error;
    }
  },
};

// Workouts API
// According to docs: v2/workouts/{start date}/{end date}
export const workoutsAPI = {
  // Get workouts by date range
  // Endpoint: GET /v2/workouts/{startDate}/{endDate}
  // Dates should be in format: YYYY-MM-DD or ISO 8601 datetime
  getWorkouts: async (startDate, endDate) => {
    if (!startDate || !endDate) {
      // If no dates provided, use default range (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      // Format dates as YYYY-MM-DD
      const formatDate = (date) => date.toISOString().split("T")[0];
      startDate = formatDate(thirtyDaysAgo);
      endDate = formatDate(today);
    }

    // Format dates if needed
    const formatDate = (date) => {
      if (typeof date === "string") {
        // If already formatted, use it
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
        // Try to parse and format
        const d = new Date(date);
        return d.toISOString().split("T")[0];
      }
      if (date instanceof Date) {
        return date.toISOString().split("T")[0];
      }
      return date;
    };

    const formattedStart = formatDate(startDate);
    const formattedEnd = formatDate(endDate);

    return apiRequest(`/v2/workouts/${formattedStart}/${formattedEnd}`);
  },

  // Get workout details by ID
  // Endpoint: GET /v2/workouts/id/{workoutId}
  // Alternative: GET /v2/workouts/{athleteId}/id/{workoutId} (for coaches accessing athlete workouts)
  // Workout IDs are now 64-bit integers
  // Note: The workout must belong to the authenticated athlete, otherwise you'll get 403 Forbidden
  getWorkoutDetails: async (workoutId, athleteId = null) => {
    // If athleteId is provided, use the coach endpoint format
    if (athleteId) {
      return apiRequest(`/v2/workouts/${athleteId}/id/${workoutId}`);
    }
    // Otherwise, use the athlete endpoint (for authenticated user's own workouts)
    return apiRequest(`/v2/workouts/id/${workoutId}`);
  },

  // Get workout of the day (WOD)
  // Endpoint: GET /v2/workouts/wod/{date}
  // Date as path parameter (not query parameter!)
  getWOD: async (date) => {
    // Format date if needed
    let formattedDate;
    if (date) {
      if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        formattedDate = date;
      } else {
        const d = new Date(date);
        formattedDate = d.toISOString().split("T")[0];
      }
    } else {
      formattedDate = new Date().toISOString().split("T")[0];
    }

    return apiRequest(`/v2/workouts/wod/${formattedDate}`);
  },

  // Get workouts by athlete ID and date range (for coaches)
  // Endpoint: GET /v2/workouts/{athleteId}/{startDate}/{endDate}
  getWorkoutsByAthlete: async (athleteId, startDate, endDate) => {
    if (!athleteId) {
      throw new Error("Athlete ID is required");
    }
    if (!startDate || !endDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const formatDate = (date) => date.toISOString().split("T")[0];
      startDate = formatDate(thirtyDaysAgo);
      endDate = formatDate(today);
    }
    const formatDate = (date) => {
      if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/))
        return date;
      if (date instanceof Date) return date.toISOString().split("T")[0];
      return date;
    };
    return apiRequest(
      `/v2/workouts/${athleteId}/${formatDate(startDate)}/${formatDate(
        endDate
      )}`
    );
  },

  // Get changed workouts
  // Endpoint: GET /v2/workouts/changed?date={date}
  getChangedWorkouts: async (date) => {
    const formatDate = (date) => {
      if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/))
        return date;
      if (date instanceof Date) return date.toISOString().split("T")[0];
      return new Date().toISOString().split("T")[0];
    };
    const formattedDate = formatDate(date);
    return apiRequest(`/v2/workouts/changed?date=${formattedDate}`);
  },

  // Get changed workouts for athlete
  // Endpoint: GET /v2/workouts/{athleteId}/changed?date={date}
  getChangedWorkoutsByAthlete: async (athleteId, date) => {
    if (!athleteId) {
      throw new Error("Athlete ID is required");
    }
    const formatDate = (date) => {
      if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/))
        return date;
      if (date instanceof Date) return date.toISOString().split("T")[0];
      return new Date().toISOString().split("T")[0];
    };
    const formattedDate = formatDate(date);
    return apiRequest(
      `/v2/workouts/${athleteId}/changed?date=${formattedDate}`
    );
  },

  // Get workout mean max data
  // Endpoint: GET /v2/workouts/id/{workoutId}/meanmaxes
  getWorkoutMeanMaxes: async (workoutId, athleteId = null) => {
    if (athleteId) {
      return apiRequest(`/v2/workouts/${athleteId}/id/${workoutId}/meanmaxes`);
    }
    return apiRequest(`/v2/workouts/id/${workoutId}/meanmaxes`);
  },

  // Get workout time in zones
  // Endpoint: GET /v2/workouts/id/{workoutId}/timeinzones
  getWorkoutTimeInZones: async (workoutId, athleteId = null) => {
    if (athleteId) {
      return apiRequest(
        `/v2/workouts/${athleteId}/id/${workoutId}/timeinzones`
      );
    }
    return apiRequest(`/v2/workouts/id/${workoutId}/timeinzones`);
  },

  // Get workout details
  // Endpoint: GET /v2/workouts/id/{workoutId}/details
  getWorkoutDetailsFull: async (workoutId, athleteId = null) => {
    if (athleteId) {
      return apiRequest(`/v2/workouts/${athleteId}/id/${workoutId}/details`);
    }
    return apiRequest(`/v2/workouts/id/${workoutId}/details`);
  },

  // Post workout comment
  // Endpoint: POST /v2/workouts/{athleteId}/id/{workoutId}/comment
  postWorkoutComment: async (athleteId, workoutId, comment) => {
    if (!athleteId || !workoutId) {
      throw new Error("Athlete ID and Workout ID are required");
    }
    return apiRequest(`/v2/workouts/${athleteId}/id/${workoutId}/comment`, {
      method: "POST",
      body: JSON.stringify(comment),
    });
  },

  // Delete workout
  // Endpoint: DELETE /v2/workouts/id/{workoutId}
  deleteWorkout: async (workoutId, athleteId = null) => {
    if (athleteId) {
      return apiRequest(`/v2/workouts/${athleteId}/id/${workoutId}`, {
        method: "DELETE",
      });
    }
    return apiRequest(`/v2/workouts/id/${workoutId}`, {
      method: "DELETE",
    });
  },

  // Create workout plan
  // Endpoint: POST /v2/workouts/plan
  createWorkoutPlan: async (planData) => {
    return apiRequest("/v2/workouts/plan", {
      method: "POST",
      body: JSON.stringify(planData),
    });
  },

  // Update workout plan
  // Endpoint: PUT /v2/workouts/plan/{id}
  updateWorkoutPlan: async (planId, planData) => {
    if (!planId) {
      throw new Error("Plan ID is required");
    }
    return apiRequest(`/v2/workouts/plan/${planId}`, {
      method: "PUT",
      body: JSON.stringify(planData),
    });
  },

  // Get workout plan (using workouts endpoint with date range)
  getWorkoutPlan: async () => {
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    const formatDate = (date) => date.toISOString().split("T")[0];
    const startDate = formatDate(today);
    const endDate = formatDate(sevenDaysLater);

    return apiRequest(`/v2/workouts/${startDate}/${endDate}`);
  },

  // Get WOD file
  // Endpoint: GET /v2/workouts/wod/file/{workoutId}/?format={file format}
  getWODFile: async (workoutId, format = "tcx") => {
    if (!workoutId) {
      throw new Error("Workout ID is required");
    }
    return apiRequest(`/v2/workouts/wod/file/${workoutId}/?format=${format}`);
  },
};

// Events API
// According to docs: v2/events/{date} or v2/events/next
export const eventsAPI = {
  // Get next event
  // Endpoint: GET /v2/events/next
  getNextEvent: async () => {
    return apiRequest("/v2/events/next");
  },

  // Get events for a specific date
  // Endpoint: GET /v2/events/{date}
  // Date format: YYYY-MM-DD
  getEventsByDate: async (date) => {
    let formattedDate;
    if (date) {
      if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        formattedDate = date;
      } else {
        const d = new Date(date);
        formattedDate = d.toISOString().split("T")[0];
      }
    } else {
      formattedDate = new Date().toISOString().split("T")[0];
    }

    return apiRequest(`/v2/events/${formattedDate}`);
  },

  // Get events (alias - gets today's events by default)
  getEvents: async (date) => {
    return eventsAPI.getEventsByDate(date);
  },

  // Create event
  // Endpoint: POST /v2/events
  // Required fields:
  // - AthleteId (automatically fetched if not provided)
  // - EventType (valid types: RoadRunning, TrailRunning, Running, Cycling, Triathlon, Other, etc.)
  // - EventDate (date-time in ISO 8601 format, local time)
  createEvent: async (eventData) => {
    // If AthleteId is not provided, fetch it from the athlete profile
    if (!eventData.AthleteId) {
      try {
        const profile = await athleteAPI.getProfile();
        eventData.AthleteId = profile.Id;
      } catch (error) {
        throw new Error(
          "Could not fetch athlete ID. Please ensure you are authenticated. " +
            error.message
        );
      }
    }

    // Transform common field names to TrainingPeaks format
    // If EventDate is not provided, use startDate
    if (!eventData.EventDate) {
      if (eventData.startDate) {
        eventData.EventDate = eventData.startDate;
        // Remove startDate as we're using EventDate
        delete eventData.startDate;
      } else {
        // Default to current date/time if no date provided
        eventData.EventDate = new Date().toISOString();
      }
    }

    // Remove endDate if present (API uses EventDate for the event date/time)
    if (eventData.endDate) {
      delete eventData.endDate;
    }

    // Ensure EventType is set (default to "Other" if not provided)
    // Valid EventTypes: RoadRunning, TrailRunning, TrackRunning, CrossCountry, Running,
    // RoadCycling, MountainBiking, Cyclocross, TrackCycling, Cycling, OpenWaterSwimming,
    // PoolSwimming, Triathlon, Xterra, Duathlon, Aquabike, Aquathon, Multisport, Regatta,
    // Rowing, AlpineSkiing, NordicSkiing, SkiMountaineering, Snowshoe, Snow, Adventure,
    // Obstacle, SpeedSkate, Other
    if (!eventData.EventType) {
      eventData.EventType = "Other";
    }

    return apiRequest("/v2/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  },
};

// Coach API
export const coachAPI = {
  // Get coach athletes
  // Endpoint: GET /v1/coach/athletes
  getAthletes: async () => {
    return apiRequest("/v1/coach/athletes");
  },

  // Get coach athletes zones
  // Endpoint: GET /v1/coach/athletes/zones
  getAthletesZones: async () => {
    return apiRequest("/v1/coach/athletes/zones");
  },

  // Get coach athletes zones by type
  // Endpoint: GET /v1/coach/athletes/zones/{zone_type}
  getAthletesZonesByType: async (zoneType) => {
    if (!zoneType) {
      throw new Error(
        "Zone type is required. Valid types: heartrate, speed, power"
      );
    }
    const validTypes = ["heartrate", "speed", "power"];
    if (!validTypes.includes(zoneType.toLowerCase())) {
      throw new Error(
        `Invalid zone type. Valid types are: ${validTypes.join(", ")}`
      );
    }
    return apiRequest(`/v1/coach/athletes/zones/${zoneType.toLowerCase()}`);
  },

  // Get coach assistants
  // Endpoint: GET /v1/coach/assistants
  getAssistants: async () => {
    return apiRequest("/v1/coach/assistants");
  },

  // Get coach assistant by ID
  // Endpoint: GET /v1/coach/assistants/{assistant_id}
  getAssistant: async (assistantId) => {
    if (!assistantId) {
      throw new Error("Assistant ID is required");
    }
    return apiRequest(`/v1/coach/assistants/${assistantId}`);
  },

  // Get assistant athletes
  // Endpoint: GET /v1/coach/assistants/{assistant_id}/athletes
  getAssistantAthletes: async (assistantId) => {
    if (!assistantId) {
      throw new Error("Assistant ID is required");
    }
    return apiRequest(`/v1/coach/assistants/${assistantId}/athletes`);
  },

  // Get coach profile
  // Endpoint: GET /v1/coach/profile
  getProfile: async () => {
    return apiRequest("/v1/coach/profile");
  },
};

// Metrics API
// According to docs: v2/metrics/{startDate}/{endDate} for GET, v2/metrics for POST
export const metricsAPI = {
  // Get metrics by metric ID
  // Endpoint: GET /v2/metrics/{metric_id}
  getMetricById: async (metricId) => {
    if (!metricId) {
      throw new Error("Metric ID is required");
    }
    return apiRequest(`/v2/metrics/${metricId}`);
  },

  // Get metrics by date range
  // Endpoint: GET /v2/metrics/{startDate}/{endDate}
  // Dates should be in format: YYYY-MM-DD
  getMetrics: async (startDate, endDate) => {
    if (!startDate || !endDate) {
      // If no dates provided, use default range (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      // Format dates as YYYY-MM-DD
      const formatDate = (date) => date.toISOString().split("T")[0];
      startDate = formatDate(thirtyDaysAgo);
      endDate = formatDate(today);
    }

    // Format dates if needed
    const formatDate = (date) => {
      if (typeof date === "string") {
        // If already formatted, use it
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
        // Try to parse and format
        const d = new Date(date);
        return d.toISOString().split("T")[0];
      }
      if (date instanceof Date) {
        return date.toISOString().split("T")[0];
      }
      return date;
    };

    const formattedStart = formatDate(startDate);
    const formattedEnd = formatDate(endDate);

    return apiRequest(`/v2/metrics/${formattedStart}/${formattedEnd}`);
  },

  // Get metrics by athlete ID and date range
  // Endpoint: GET /v2/metrics/{athleteId}/{startDate}/{endDate}
  getMetricsByAthlete: async (athleteId, startDate, endDate) => {
    if (!athleteId) {
      throw new Error("Athlete ID is required");
    }
    if (!startDate || !endDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const formatDate = (date) => date.toISOString().split("T")[0];
      startDate = formatDate(thirtyDaysAgo);
      endDate = formatDate(today);
    }
    const formatDate = (date) => {
      if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/))
        return date;
      if (date instanceof Date) return date.toISOString().split("T")[0];
      return date;
    };
    return apiRequest(
      `/v2/metrics/${athleteId}/${formatDate(startDate)}/${formatDate(endDate)}`
    );
  },

  // Create/update metric
  // Endpoint: POST /v2/metrics
  // Required fields:
  // - DateTime (UTC format, cannot be older than one year)
  // - UploadClient (your application name)
  // - At least one metric value (WeightInKilograms, Steps, etc.)
  upsertMetric: async (metricData) => {
    // Ensure required fields are present
    if (!metricData.DateTime) {
      // Default to current date/time in UTC if not provided
      metricData.DateTime = new Date().toISOString();
    }

    if (!metricData.UploadClient) {
      // Default upload client name
      metricData.UploadClient = "TrainingPeaks API Tester";
    }

    // Validate that at least one metric value is provided
    const metricFields = [
      "WeightInKilograms",
      "Steps",
      "SleepHours",
      "Pulse",
      "Stress",
      "Mood",
      "Fatigue",
      "Soreness",
      "SleepQuality",
      "OverallFeeling",
      "HRV",
      "WaterConsumption",
      "BMI",
      "PercentFat",
      "MuscleMass",
    ];

    const hasMetricValue = metricFields.some(
      (field) => metricData[field] !== undefined && metricData[field] !== null
    );

    if (!hasMetricValue) {
      throw new Error(
        "At least one metric value is required. Valid fields include: " +
          metricFields.join(", ")
      );
    }

    return apiRequest("/v2/metrics", {
      method: "POST",
      body: JSON.stringify(metricData),
    });
  },
};

// File API
export const fileAPI = {
  // Upload file
  // Endpoint: POST /v3/file
  uploadFile: async (fileData) => {
    return apiRequest("/v3/file", {
      method: "POST",
      body: JSON.stringify(fileData),
    });
  },
};

// Webhook API (Early Access)
export const webhookAPI = {
  // Create webhook subscription
  // Endpoint: POST /v1/webhook/subscriptions
  createSubscription: async (subscriptionData) => {
    return apiRequest("/v1/webhook/subscriptions", {
      method: "POST",
      body: JSON.stringify(subscriptionData),
    });
  },

  // Get webhook subscriptions
  // Endpoint: GET /v1/webhook/subscriptions
  getSubscriptions: async () => {
    return apiRequest("/v1/webhook/subscriptions");
  },

  // Update webhook subscription
  // Endpoint: PUT /v1/webhook/subscriptions/{subscription-id}
  updateSubscription: async (subscriptionId, subscriptionData) => {
    if (!subscriptionId) {
      throw new Error("Subscription ID is required");
    }
    return apiRequest(`/v1/webhook/subscriptions/${subscriptionId}`, {
      method: "PUT",
      body: JSON.stringify(subscriptionData),
    });
  },

  // Delete webhook subscription
  // Endpoint: DELETE /v1/webhook/subscriptions/{subscription-id}
  deleteSubscription: async (subscriptionId) => {
    if (!subscriptionId) {
      throw new Error("Subscription ID is required");
    }
    return apiRequest(`/v1/webhook/subscriptions/${subscriptionId}`, {
      method: "DELETE",
    });
  },
};
