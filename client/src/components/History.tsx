import { useEffect, useState } from "react";
import { fetchHistory } from "../api";
import { useUser } from "../UserContext";
import type { WorkoutWithSets } from "../types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffDay) > 0) {
    return rtf.format(-diffDay, "day");
  } else if (Math.abs(diffHr) > 0) {
    return rtf.format(-diffHr, "hour");
  } else if (Math.abs(diffMin) > 0) {
    return rtf.format(-diffMin, "minute");
  } else {
    return rtf.format(-diffSec, "second");
  }
}

function groupSetsByArea(
  workout: WorkoutWithSets
): { area: string; totalPts: number; exercises: string[] }[] {
  const grouped = new Map<
    string,
    { totalPts: number; exercises: Set<string> }
  >();
  for (const s of workout.sets) {
    const entry = grouped.get(s.body_area_name) ?? {
      totalPts: 0,
      exercises: new Set<string>(),
    };
    entry.totalPts += s.pts;
    entry.exercises.add(s.exercise_name);
    grouped.set(s.body_area_name, entry);
  }
  return Array.from(grouped.entries()).map(([area, data]) => ({
    area,
    totalPts: data.totalPts,
    exercises: Array.from(data.exercises),
  }));
}

export default function History({ refreshKey }: { refreshKey?: number }) {
  const { user } = useUser();
  const [logs, setLogs] = useState<WorkoutWithSets[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchHistory(user.id)
      .then(setLogs)
      .catch(() => setError("Failed to load history"));
  }, [user, refreshKey]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        {logs.map((log) => {
          const areas = groupSetsByArea(log);
          const isExpanded = expanded.has(log.id);
          const totalPts = areas.reduce((sum, a) => sum + a.totalPts, 0);
          return (
            <div key={log.id} className="history-item">
              <button
                className="history-header"
                onClick={() => toggleExpand(log.id)}
              >
                <span className="history-date">
                  {formatDate(log.workout_date)}
                </span>
                <span className="history-areas">
                  {areas.map((a) => a.area).join(", ")}
                </span>
                <span className="history-total-pts">
                  {totalPts} pts
                </span>
                <span className="group-arrow">
                  {isExpanded ? "\u25BC" : "\u25B6"}
                </span>
              </button>
              {isExpanded && (
                <div className="history-details">
                  {areas.map((a) => (
                    <div key={a.area} className="history-area-group">
                      <div className="history-area-header">
                        <span>{a.area}</span>
                        <span className="history-area-pts">
                          {a.totalPts} pts
                        </span>
                      </div>
                      <div className="history-exercises">
                        {a.exercises.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
