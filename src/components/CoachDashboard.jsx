import { useState, useEffect, useCallback } from "react";
import { coachAPI, workoutsAPI } from "../services/api";

export default function CoachDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    communityPulse: { positive: 0, neutral: 0, negative: 0 },
    priorities: [],
    squadNumbers: { total: 0, joiners: 0, leavers: 0, net: 0, awaiting: 0 },
  });

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Calculate community metrics
  const calculateMetrics = useCallback((athletesList, workoutsMap) => {
    let totalWorkouts = 0;
    let completedWorkouts = 0;
    const athleteIssues = {};

    athletesList.forEach((athlete) => {
      const workouts = workoutsMap[athlete.Id] || [];
      totalWorkouts += workouts.length;

      const completed = workouts.filter((w) => {
        if (w.IsCompleted !== undefined) return w.IsCompleted;
        if (w.CompletedDate) return true;
        if (w.Status === "Completed" || w.Status === "Done") return true;
        return false;
      }).length;

      completedWorkouts += completed;

      // Track issues
      const scheduled = workouts.length;
      const completionRate = scheduled > 0 ? completed / scheduled : 1;

      if (scheduled === 0) {
        athleteIssues[athlete.Id] = { type: "no-workouts", athlete };
      } else if (completionRate < 0.5) {
        athleteIssues[athlete.Id] = {
          type: "low-completion",
          athlete,
          rate: completionRate,
        };
      }
    });

    // Calculate community pulse
    const completionRate =
      totalWorkouts > 0 ? completedWorkouts / totalWorkouts : 1;
    let positive, neutral, negative;

    if (completionRate >= 0.7) {
      positive = Math.round(completionRate * 100);
      neutral = Math.round((1 - completionRate) * 50);
      negative = 100 - positive - neutral;
    } else if (completionRate >= 0.4) {
      neutral = Math.round(completionRate * 50);
      positive = Math.round((1 - completionRate) * 30);
      negative = 100 - positive - neutral;
    } else {
      negative = Math.round((1 - completionRate) * 100);
      neutral = Math.round(completionRate * 30);
      positive = 100 - negative - neutral;
    }

    // Generate priorities
    const priorities = [];

    // Check for injury/recovery patterns (workouts with low completion or missing)
    const injuryCount = Object.values(athleteIssues).filter(
      (issue) => issue.type === "low-completion" && issue.rate < 0.3
    ).length;
    if (injuryCount > 0) {
      priorities.push({
        rank: 1,
        title: "Injury & Recovery",
        action: "Host webinar on injury prevention or recovery strategies",
        count: injuryCount,
        trend: "up",
      });
    }

    // Check for guidance requests (athletes with no workouts)
    const guidanceCount = Object.values(athleteIssues).filter(
      (issue) => issue.type === "no-workouts"
    ).length;
    if (guidanceCount > 0) {
      priorities.push({
        rank: priorities.length + 1,
        title: "Requests for Guidance",
        action: "Create Q&A post, webinar, or educational content series",
        count: guidanceCount,
        trend: "up",
      });
    }

    // Check for race preparation (upcoming events or high training load)
    const racePrepCount = athletesList.filter((athlete) => {
      const workouts = workoutsMap[athlete.Id] || [];
      return workouts.length > 5; // High training load might indicate race prep
    }).length;
    if (racePrepCount > 0) {
      priorities.push({
        rank: priorities.length + 1,
        title: "Race Preparation",
        action: "Publish race-day strategy guide or host prep session",
        count: racePrepCount,
        trend: "up",
      });
    }

    // Training challenges
    const challengeCount = Object.values(athleteIssues).filter(
      (issue) =>
        issue.type === "low-completion" && issue.rate >= 0.3 && issue.rate < 0.5
    ).length;
    if (challengeCount > 0) {
      priorities.push({
        rank: priorities.length + 1,
        title: "Training Challenges",
        action:
          "Consider recovery content, motivation boost sessions, or periodization guidance",
        count: challengeCount,
        trend: "up",
      });
    }

    // Nutrition
    if (priorities.length < 5) {
      priorities.push({
        rank: priorities.length + 1,
        title: "Nutrition & Fuelling",
        action: "Share nutrition guide, recipe post, or fuelling Q&A",
        count: 1,
        trend: "up",
      });
    }

    setMetrics((prev) => ({
      communityPulse: { positive, neutral, negative },
      priorities: priorities.slice(0, 5),
      squadNumbers: prev.squadNumbers,
    }));
  }, []);

  // Fetch athletes
  const fetchAthletes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await coachAPI.getAthletes();
      const athletesList = Array.isArray(data) ? data : [];

      // Update squad numbers
      setMetrics((prev) => ({
        ...prev,
        squadNumbers: {
          total: athletesList.length,
          joiners: 0, // Would need historical data
          leavers: 0, // Would need historical data
          net: 0,
          awaiting: 0, // Would need invitation data
        },
      }));

      // Fetch workouts for each athlete
      if (athletesList.length > 0) {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const startDate = sevenDaysAgo.toISOString().split("T")[0];
        const endDate = today.toISOString().split("T")[0];

        const workoutPromises = athletesList.map(async (athlete) => {
          try {
            const workouts = await workoutsAPI.getWorkoutsByAthlete(
              athlete.Id,
              startDate,
              endDate
            );
            return {
              athleteId: athlete.Id,
              workouts: Array.isArray(workouts) ? workouts : [],
            };
          } catch {
            return { athleteId: athlete.Id, workouts: [] };
          }
        });

        const workoutResults = await Promise.all(workoutPromises);
        const workoutsMap = {};
        workoutResults.forEach((result) => {
          workoutsMap[result.athleteId] = result.workouts;
        });

        // Calculate metrics
        calculateMetrics(athletesList, workoutsMap);
      }
    } catch (err) {
      // Provide more helpful error messages
      if (
        err.status === 401 ||
        err.message.includes("401") ||
        err.message.includes("Unauthorized")
      ) {
        setError(
          '401 Unauthorized: This endpoint requires the "coach:athletes" scope. ' +
            "Please log out and log back in to get a new token with the updated scopes. " +
            "Also ensure your TrainingPeaks account is a coach account."
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [calculateMetrics]);

  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

  const getEngagementStatus = () => {
    const { positive } = metrics.communityPulse;
    if (positive >= 50) return "Highly Engaged & Positive";
    if (positive >= 30) return "Moderately Engaged";
    return "Needs Attention";
  };

  return (
    <div className="coach-dashboard-container">
      <div className="coach-dashboard-header">
        <h1>BF Hub Community & Connection</h1>
        <div className="coach-overview-header">
          <span className="coach-overview-label">Coach Overview</span>
          <span className="greeting">{getGreeting()}</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading dashboard data...</div>
      ) : (
        <div className="dashboard-content">
          {/* Community Pulse */}
          <div className="dashboard-section">
            <h2 className="section-title">Community Pulse</h2>
            <div className="pulse-status">{getEngagementStatus()}</div>
            <div className="sentiment-bars">
              <div className="sentiment-item positive">
                <span className="sentiment-label">Positive</span>
                <span className="sentiment-value">
                  {metrics.communityPulse.positive}%
                </span>
              </div>
              <div className="sentiment-item neutral">
                <span className="sentiment-label">Neutral</span>
                <span className="sentiment-value">
                  {metrics.communityPulse.neutral}%
                </span>
              </div>
              <div className="sentiment-item negative">
                <span className="sentiment-label">Negative</span>
                <span className="sentiment-value">
                  {metrics.communityPulse.negative}%
                </span>
              </div>
            </div>
          </div>

          {/* Where Coach Action Matters Most */}
          <div className="dashboard-section">
            <h2 className="section-title">Where Coach Action Matters Most</h2>
            <div className="priorities-list">
              {metrics.priorities.length === 0 ? (
                <div className="no-priorities">
                  No priority actions identified at this time
                </div>
              ) : (
                metrics.priorities.map((priority) => (
                  <div key={priority.rank} className="priority-item">
                    <div className="priority-rank">{priority.rank}.</div>
                    <div className="priority-content">
                      <div className="priority-header">
                        <span className="priority-title">{priority.title}</span>
                        <span className="priority-trend">📈</span>
                        <span className="priority-count">{priority.count}</span>
                      </div>
                      <div className="priority-action">{priority.action}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {metrics.priorities.length > 0 && (
              <div className="priority-summary">
                Community mood is {getEngagementStatus().toLowerCase()}. Top
                priorities:{" "}
                {metrics.priorities
                  .slice(0, 3)
                  .map((p) => p.title.toLowerCase())
                  .join(", ")}
                .
              </div>
            )}
          </div>

          {/* Squad Numbers */}
          <div className="dashboard-section">
            <h2 className="section-title">Squad Numbers</h2>
            <div className="squad-stats">
              <div className="stat-item">
                <span className="stat-value">{metrics.squadNumbers.total}</span>
                <span className="stat-label">Total Athletes</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {metrics.squadNumbers.joiners}
                </span>
                <span className="stat-label">Joiners</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {metrics.squadNumbers.leavers}
                </span>
                <span className="stat-label">Leavers</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">+{metrics.squadNumbers.net}</span>
                <span className="stat-label">Total Net</span>
              </div>
            </div>
            {metrics.squadNumbers.awaiting > 0 && (
              <div className="awaiting-invites">
                {metrics.squadNumbers.awaiting} New Sign-ups Awaiting Invitation
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="dashboard-section">
            <h2 className="section-title">Messages</h2>
            <div className="message-stats">
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Direct Messages</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Unclaimed Messages</span>
              </div>
            </div>
          </div>

          {/* Journal Insights */}
          <div className="dashboard-section">
            <h2 className="section-title">Journal Insights</h2>
            <div className="journal-stats">
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Journal Entries</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Flagged Entries</span>
              </div>
            </div>
          </div>

          {/* Goal Sheets */}
          <div className="dashboard-section">
            <h2 className="section-title">Goal Sheets</h2>
            <div className="goal-stats">
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">With Goal Sheets</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Missing Goals</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Recently Updated</span>
              </div>
            </div>
          </div>

          {/* Challenges */}
          <div className="dashboard-section">
            <div className="section-header-with-action">
              <h2 className="section-title">Challenges</h2>
              <button className="add-button">+</button>
            </div>
            <div className="challenge-stats">
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Drafts</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Participants</span>
              </div>
            </div>
          </div>

          {/* Female Athlete Forum */}
          <div className="dashboard-section forum-section">
            <div className="forum-card">
              <span className="forum-title">Female Athlete Forum</span>
              <span className="forum-arrow">→</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
