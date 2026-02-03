import { useEffect, useState } from "react";
import { fetchSuggestions, fetchHistory } from "../api";
import { useUser } from "../UserContext";
import type { FocusAreaSuggestion, WorkoutWithSets } from "../types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function workoutsThisWeek(logs: WorkoutWithSets[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return logs.filter(
    (log) => new Date(log.completed_at!).getTime() >= weekAgo
  ).length;
}

function currentStreak(logs: WorkoutWithSets[]): number {
  if (logs.length === 0) return 0;

  const dates = new Set(
    logs.map((log) =>
      new Date(log.completed_at!).toISOString().substring(0, 10)
    )
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= dates.size + 1; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().substring(0, 10);
    if (dates.has(dateStr)) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }

  return streak;
}

function dueLabel(s: FocusAreaSuggestion): string {
  if (s.daysSinceLast === null) return "never done";
  const diff = s.daysSinceLast - s.focusArea.periodLengthDays;
  if (diff > 0) return `${Math.round(diff)}d overdue`;
  if (diff === 0) return "due today";
  return `due in ${Math.round(Math.abs(diff))}d`;
}

export default function Home({
  onStartWorkout,
  refreshKey,
}: {
  onStartWorkout: () => void;
  refreshKey?: number;
}) {
  const { user } = useUser();
  const [suggestions, setSuggestions] = useState<FocusAreaSuggestion[]>([]);
  const [history, setHistory] = useState<WorkoutWithSets[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      fetchSuggestions(user.id).then((r) => setSuggestions(r.suggestions)),
      fetchHistory(user.id).then(setHistory),
    ])
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, [user, refreshKey]);

  if (error) return <div className="error">{error}</div>;
  if (loading) return <div className="loading">Loading...</div>;

  const hasWorkouts = history.length > 0;
  const lastLog = hasWorkouts ? history[0] : null;
  const dueAreas = suggestions.filter((s) => s.priority > 0);

  return (
    <div className="home">
      {hasWorkouts && lastLog ? (
        <div className="card">
          <h2>Recent Activity</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">
                {timeAgo(lastLog.completed_at!)}
              </span>
              <span className="stat-label">Last workout</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{workoutsThisWeek(history)}</span>
              <span className="stat-label">This week</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {currentStreak(history)} day
                {currentStreak(history) !== 1 ? "s" : ""}
              </span>
              <span className="stat-label">Current streak</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{history.length}</span>
              <span className="stat-label">Total workouts</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <h2>Welcome</h2>
          <p className="muted">
            No workouts logged yet. Start your first one!
          </p>
        </div>
      )}

      {suggestions.length > 0 ? (
        <div className="card">
          <h2>What's Due</h2>
          <div className="due-list">
            {suggestions.slice(0, 6).map((s) => {
              const pct = Math.min(
                100,
                Math.round(s.fulfillmentFraction * 100)
              );
              const isDue = s.priority > 0;
              return (
                <div
                  key={s.focusArea.id}
                  className={`due-item${isDue ? " overdue" : " on-track"}`}
                >
                  <div className="due-item-header">
                    <span className="due-area-name">
                      {s.focusArea.bodyArea.name}
                    </span>
                    <span
                      className={`due-label${isDue ? " overdue-label" : " on-track-label"}`}
                    >
                      {dueLabel(s)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill${pct >= 100 ? " complete" : ""}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="due-pts">
                    {s.ptsFulfilled} / {s.focusArea.ptsPerPeriod}{" "}
                    {s.focusArea.ptsType === "active_minutes" ? "min" : "pts"}
                  </span>
                </div>
              );
            })}
          </div>
          {dueAreas.length === 0 && (
            <p className="muted">All caught up! Nice work.</p>
          )}
        </div>
      ) : (
        <div className="card">
          <h2>No Active Plan</h2>
          <p className="muted">
            Set up a workout plan in the Plans tab to get suggestions.
          </p>
        </div>
      )}

      <div className="card">
        <button className="btn-cta" onClick={onStartWorkout}>
          New Workout
        </button>
      </div>
    </div>
  );
}
