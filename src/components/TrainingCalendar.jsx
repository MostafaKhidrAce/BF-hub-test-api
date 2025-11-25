import { useState, useEffect, useCallback } from "react";
import { workoutsAPI } from "../services/api";

export default function TrainingCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  // Get start and end of week for the selected date
  const getWeekRange = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // Fetch workouts for the week
  const fetchWorkouts = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = getWeekRange(date);
      const data = await workoutsAPI.getWorkouts(
        formatDate(start),
        formatDate(end)
      );
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts(selectedDate);
  }, [selectedDate, fetchWorkouts]);

  // Get workouts for selected day
  const getDayWorkouts = () => {
    const selectedDateStr = formatDate(selectedDate);
    return workouts.filter((workout) => {
      if (!workout.StartDate) return false;
      const workoutDate = new Date(workout.StartDate);
      return formatDate(workoutDate) === selectedDateStr;
    });
  };

  // Format time from workout
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Get duration in minutes
  const getDuration = (workout) => {
    if (workout.Duration) {
      // Duration might be in seconds or as a duration string
      if (typeof workout.Duration === "number") {
        return Math.round(workout.Duration / 60); // Convert seconds to minutes
      }
    }
    // Try to calculate from StartDate and EndDate if available
    if (workout.StartDate && workout.EndDate) {
      const start = new Date(workout.StartDate);
      const end = new Date(workout.EndDate);
      return Math.round((end - start) / 60000); // Convert milliseconds to minutes
    }
    return null;
  };

  // Check if workout is completed
  const isWorkoutDone = (workout) => {
    // Check various completion indicators
    if (workout.IsCompleted !== undefined) return workout.IsCompleted;
    if (workout.CompletedDate) return true;
    if (workout.Status === "Completed" || workout.Status === "Done")
      return true;
    // If workout has actual data, it might be completed
    if (workout.HasActualData) return true;
    return false;
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // Format day name
  const getDayName = (date) => {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  // Format date display
  const getDateDisplay = (date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const dayWorkouts = getDayWorkouts();
  const dayName = getDayName(selectedDate);
  const dateDisplay = getDateDisplay(selectedDate);

  return (
    <div className="training-calendar-container">
      <div className="training-calendar-card">
        <div className="training-calendar-header">
          <div className="training-calendar-title">
            <span className="calendar-icon">📅</span>
            <span>Training</span>
          </div>
          <div className="training-calendar-nav">
            <button
              className="nav-arrow"
              onClick={goToPreviousDay}
              aria-label="Previous day"
            >
              &lt;
            </button>
            <button
              className="nav-arrow"
              onClick={goToNextDay}
              aria-label="Next day"
            >
              &gt;
            </button>
          </div>
        </div>

        <div className="training-calendar-date">
          <div className="day-name">{dayName}</div>
          <div className="date-display">{dateDisplay}</div>
        </div>

        {error && (
          <div className="error-message" style={{ marginTop: "1rem" }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="loading" style={{ marginTop: "1rem" }}>
            Loading workouts...
          </div>
        ) : (
          <div className="training-activities">
            {dayWorkouts.length === 0 ? (
              <div className="no-workouts">
                No workouts scheduled for this day
              </div>
            ) : (
              dayWorkouts.map((workout, index) => {
                const duration = getDuration(workout);
                const time = formatTime(workout.StartDate);
                const isDone = isWorkoutDone(workout);
                const workoutName =
                  workout.WorkoutName || workout.Name || "Workout";

                return (
                  <div key={workout.Id || index} className="training-activity">
                    <div className="activity-icon">🕐</div>
                    <div className="activity-content">
                      <div className="activity-header">
                        <span className="activity-name">{workoutName}</span>
                        {isDone && (
                          <span className="activity-status">Done</span>
                        )}
                      </div>
                      <div className="activity-details">
                        {time && duration && (
                          <>
                            {time} • {duration} min
                          </>
                        )}
                        {time && !duration && time}
                        {!time && duration && `${duration} min`}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
