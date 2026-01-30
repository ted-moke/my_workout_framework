import { useEffect, useState } from "react";
import { fetchHistory } from "../api";
import type { WorkoutLog } from "../types";

export default function History({ refreshKey }: { refreshKey?: number }) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory()
      .then(setLogs)
      .catch(() => setError("Failed to load history"));
  }, [refreshKey]);

  if (error) return <div className="error">{error}</div>;

  if (logs.length === 0) {
    return (
      <div className="card">
        <h2>Recent Workouts</h2>
        <p className="muted">No workouts logged yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Recent Workouts</h2>
      <div className="history-list">
        {logs.map((log) => (
          <div key={log.id} className="history-item">
            <div className="history-header">
              <span className="history-day">Day {log.day_number}</span>
              <span className="history-areas">
                {log.focus_areas?.map((fa) => fa.name).join(", ")}
              </span>
              <span className="history-date">
                {log.workout_date
                  ? new Date(log.workout_date + "T00:00:00").toLocaleDateString()
                  : new Date(log.completed_at).toLocaleDateString()}
              </span>
            </div>
            {log.exercises.length > 0 && (
              <div className="history-exercises">
                {log.exercises.map((ex) => ex.name).join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
