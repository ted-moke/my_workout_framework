import { useEffect, useState } from "react";
import { fetchSuggestions, fetchHistory } from "../api";
import { useUser } from "../UserContext";
import type { FocusAreaSuggestion, WorkoutWithSets } from "../types";
import PointCubes from "./PointCubes";
import styles from "./Home.module.css";

const AREA_PALETTE_SIZE = 12;
function areaColorVar(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return `var(--area-color-${Math.abs(h) % AREA_PALETTE_SIZE})`;
}

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
  // const lastLog = hasWorkouts ? history[0] : null;
  const allAreas = [...suggestions].sort(
    (a, b) => (b.focusArea.ptsPerPeriod - b.ptsFulfilled) - (a.focusArea.ptsPerPeriod - a.ptsFulfilled)
  );

  return (
    <div className={styles.home}>
      {/* {hasWorkouts && lastLog ? (
        <div className="card">
          <h2>Recent Activity</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {timeAgo(lastLog.completed_at!)}
              </span>
              <span className={styles.statLabel}>Last workout</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{workoutsThisWeek(history)}</span>
              <span className={styles.statLabel}>This week</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {currentStreak(history)} day
                {currentStreak(history) !== 1 ? "s" : ""}
              </span>
              <span className={styles.statLabel}>Current streak</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{history.length}</span>
              <span className={styles.statLabel}>Total workouts</span>
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
      )} */}

      {suggestions.length > 0 ? (
        <div className="card">
          <h2>Progress</h2>
          <div className={styles.progressList}>
            {allAreas.map((s) => {
              const areaColor = areaColorVar(s.focusArea.bodyArea.name);
              return (
                <div key={s.focusArea.id} className={styles.progressRow}>
                  <span className={styles.progressLabel} style={{ color: areaColor }}>
                    {s.focusArea.bodyArea.name}
                  </span>
                  <PointCubes
                    fulfilled={s.ptsFulfilled}
                    goal={s.focusArea.ptsPerPeriod}
                    color={areaColor}
                    unit={s.focusArea.ptsType === "active_minutes" ? 15 : 1}
                  />
                </div>
              );
            })}
          </div>
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
