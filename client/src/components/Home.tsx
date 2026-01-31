import { useEffect, useState } from "react";
import { fetchStatus, fetchHistory } from "../api";
import type { StatusResponse, WorkoutLog } from "../types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function workoutsThisWeek(logs: WorkoutLog[]): number {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  return logs.filter((log) => {
    const date = log.workout_date
      ? new Date(log.workout_date.substring(0, 10) + "T00:00:00").getTime()
      : new Date(log.completed_at).getTime();
    return date >= weekAgo;
  }).length;
}

function currentStreak(logs: WorkoutLog[]): number {
  if (logs.length === 0) return 0;

  const dates = new Set(
    logs.map((log) => {
      if (log.workout_date) return log.workout_date.substring(0, 10);
      return new Date(log.completed_at).toISOString().substring(0, 10);
    })
  );

  const sortedDates = Array.from(dates).sort().reverse();
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= sortedDates.length; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().substring(0, 10);
    if (dates.has(dateStr)) {
      streak++;
    } else if (i === 0) {
      // Today doesn't have a workout yet, that's okay — keep checking from yesterday
      continue;
    } else {
      break;
    }
  }

  return streak;
}

export default function Home({
  onStartWorkout,
  refreshKey,
}: {
  onStartWorkout: () => void;
  refreshKey?: number;
}) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStatus()
      .then(setStatus)
      .catch(() => setError("Failed to load status"));
    fetchHistory()
      .then(setLogs)
      .catch(() => setError("Failed to load history"));
  }, [refreshKey]);

  if (error) return <div className="error">{error}</div>;
  if (!status) return <div className="loading">Loading...</div>;

  const hasWorkouts = logs.length > 0;
  const lastLog = hasWorkouts ? logs[0] : null;
  const { nextDay } = status;

  return (
    <div className="home">
      {hasWorkouts && lastLog ? (
        <div className="card">
          <h2>Recent Activity</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">
                {timeAgo(lastLog.workout_date ?? lastLog.completed_at)}
              </span>
              <span className="stat-label">Last workout</span>
              <span className="stat-detail">
                Day {lastLog.day_number} —{" "}
                {lastLog.focus_areas?.map((fa) => fa.name).join(", ")}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{workoutsThisWeek(logs)}</span>
              <span className="stat-label">This week</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{currentStreak(logs)} day{currentStreak(logs) !== 1 ? "s" : ""}</span>
              <span className="stat-label">Current streak</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{logs.length}</span>
              <span className="stat-label">Total workouts</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <h2>Welcome</h2>
          <p className="muted">No workouts logged yet. Start your first one!</p>
        </div>
      )}

      <div className="card">
        <h2>Up Next</h2>
        <p className="next-day-preview">
          Day {nextDay.day_number} —{" "}
          {nextDay.focus_areas.map((fa) => fa.name).join(", ")}
        </p>
        <button className="btn-cta" onClick={onStartWorkout}>
          New Workout
        </button>
      </div>
    </div>
  );
}
