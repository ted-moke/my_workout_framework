import { useEffect, useState } from "react";
import { fetchHistory } from "../api";
import { useUser } from "../UserContext";
import type { FocusAreaSuggestion, WorkoutWithSets } from "../types";
import styles from "./Progress.module.css";

function workoutsThisWeek(logs: WorkoutWithSets[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return logs.filter(
    (log) => new Date(log.workout_date).getTime() >= weekAgo
  ).length;
}

function avgPtsPerWorkout(
  logs: WorkoutWithSets[],
  ptsTypeByArea: Map<string, string>
): number {
  if (logs.length === 0) return 0;
  const total = logs.reduce((sum, log) => {
    const workoutPts = log.sets.reduce((s, set) => {
      const unit = ptsTypeByArea.get(set.body_area_name) === "active_minutes" ? 15 : 1;
      return s + set.pts / unit;
    }, 0);
    return sum + workoutPts;
  }, 0);
  return total / logs.length;
}

function pointsFilled(suggestions: FocusAreaSuggestion[]): {
  filled: number;
  total: number;
} {
  return suggestions.reduce(
    (acc, s) => {
      const unit = s.focusArea.ptsType === "active_minutes" ? 15 : 1;
      const goal = s.focusArea.ptsPerPeriod / unit;
      const filled = Math.min(s.ptsFulfilled / unit, goal);
      return { filled: acc.filled + filled, total: acc.total + goal };
    },
    { filled: 0, total: 0 }
  );
}

export default function Progress({
  suggestions,
  refreshKey,
}: {
  suggestions: FocusAreaSuggestion[];
  refreshKey?: number;
}) {
  const { user } = useUser();
  const [history, setHistory] = useState<WorkoutWithSets[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchHistory(user.id)
      .then((all) => {
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        setHistory(
          all.filter((l) => new Date(l.workout_date).getTime() >= cutoff)
        );
      })
      .catch(() => setHistory([]));
  }, [user, refreshKey]);

  if (suggestions.length === 0) return null;

  const ptsTypeByArea = new Map<string, string>(
    suggestions.map((s) => [s.focusArea.bodyArea.name, s.focusArea.ptsType])
  );
  const { filled, total } = pointsFilled(suggestions);

  return (
    <div className="card">
      <h2>Progress</h2>
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {Math.round(filled)} / {Math.round(total)}
          </span>
          <span className={styles.statLabel}>points filled</span>
        </div>
        {history.length > 0 && (
          <>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {avgPtsPerWorkout(history, ptsTypeByArea).toFixed(1)}
              </span>
              <span className={styles.statLabel}>pts / workout</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {workoutsThisWeek(history)}
              </span>
              <span className={styles.statLabel}>workouts / week</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
