import { useEffect, useState, useCallback } from "react";
import { FiPlay, FiCheck, FiTrash2 } from "react-icons/fi";
import {
  fetchSuggestions,
  startWorkout,
  finishWorkout,
  abortWorkout,
  addSet,
  removeSet,
} from "../api";
import { useUser } from "../UserContext";
import type { FocusAreaSuggestion, SetWithDetails, Workout as WorkoutType } from "../types";
import FocusAreaCard from "./FocusAreaCard";
import styles from "./Workout.module.css";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Workout({
  onWorkoutChange,
}: {
  onWorkoutChange?: () => void;
}) {
  const { user } = useUser();
  const [suggestions, setSuggestions] = useState<FocusAreaSuggestion[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutType | null>(null);
  const [sets, setSets] = useState<SetWithDetails[]>([]);
  const [workoutDate, setWorkoutDate] = useState(todayStr());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    fetchSuggestions(user.id)
      .then((data) => {
        setSuggestions(data.suggestions);
        if (data.activeWorkout) {
          setActiveWorkout(data.activeWorkout.workout);
          setSets(data.activeWorkout.sets);
        } else {
          setActiveWorkout(null);
          setSets([]);
        }
      })
      .catch(() => setError("Failed to load suggestions"))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const isActive = activeWorkout !== null;

  const handleStart = async () => {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const workout = await startWorkout(user.id, workoutDate);
      setActiveWorkout(workout);
      setSets([]);
    } catch {
      setError("Failed to start workout");
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async () => {
    if (!activeWorkout) return;
    setBusy(true);
    setError("");
    try {
      await finishWorkout(activeWorkout.id);
      onWorkoutChange?.();
      setWorkoutDate(todayStr());
      load();
    } catch {
      setError("Failed to finish workout");
    } finally {
      setBusy(false);
    }
  };

  const handleAbort = async () => {
    if (!activeWorkout) return;
    if (!confirm("Abort this workout? All sets will be discarded.")) return;
    setBusy(true);
    setError("");
    try {
      await abortWorkout(activeWorkout.id);
      onWorkoutChange?.();
      setWorkoutDate(todayStr());
      load();
    } catch {
      setError("Failed to abort workout");
    } finally {
      setBusy(false);
    }
  };

  const handleAddSet = async (exerciseId: number, pts: number) => {
    if (!activeWorkout) return;
    try {
      const newSet = await addSet(activeWorkout.id, exerciseId, pts);
      // We get back a DbSet without details; add them from our exercise data
      const exercise = suggestions
        .flatMap((s) => s.exercises)
        .find((e) => e.id === exerciseId);
      const bodyArea = suggestions.find((s) =>
        s.exercises.some((e) => e.id === exerciseId)
      );
      const setWithDetails: SetWithDetails = {
        ...newSet,
        exercise_name: exercise?.name ?? "",
        body_area_name: bodyArea?.focusArea.bodyArea.name ?? "",
      };
      setSets((prev) => [...prev, setWithDetails]);
    } catch {
      setError("Failed to add set");
    }
  };

  const handleRemoveSet = async (setId: number) => {
    // Optimistic removal
    const prevSets = sets;
    setSets((prev) => prev.filter((s) => s.id !== setId));
    try {
      await removeSet(setId);
    } catch {
      setSets(prevSets);
      setError("Failed to remove set");
    }
  };

  if (error && !loading) {
    return (
      <div className="error">
        {error}
        <button onClick={() => { setError(""); load(); }}>Retry</button>
      </div>
    );
  }
  if (loading) return <div className="loading">Loading...</div>;

  if (suggestions.length === 0) {
    return (
      <div className={styles.dashboard}>
        <div className="card">
          <h2>No Active Plan</h2>
          <p className="muted">
            Set up a workout plan in the Plans tab to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className="card">
        <div className={styles.dayHeader}>
          <h2>{isActive ? "Workout in Progress" : "Ready to Work Out"}</h2>
          {isActive && <span className="active-badge">LIVE</span>}
        </div>

        {isActive && (
          <p className={styles.saveHint}>
            Sets are saved as you add them.
          </p>
        )}

        <div className={styles.exerciseList}>
          {suggestions.map((s, i) => (
            <FocusAreaCard
              key={s.focusArea.id}
              suggestion={s}
              sets={sets}
              isActive={isActive}
              defaultOpen={isActive ? i < 3 : i === 0}
              onAddSet={handleAddSet}
              onRemoveSet={handleRemoveSet}
            />
          ))}
        </div>

        {!isActive ? (
          <div className={styles.startWorkoutRow}>
            <div className={styles.datePickerRow}>
              <label className={styles.selectorLabel} htmlFor="workout-date">Date</label>
              <input
                id="workout-date"
                type="date"
                className="date-input"
                value={workoutDate}
                max={todayStr()}
                onChange={(e) => setWorkoutDate(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={handleStart} disabled={busy}>
              <FiPlay /> {busy ? "Starting..." : "Start Workout"}
            </button>
          </div>
        ) : (
          <div className={styles.workoutActions}>
            <button
              className="btn-finish"
              onClick={handleFinish}
              disabled={busy || sets.length === 0}
            >
              <FiCheck /> {busy ? "Finishing..." : `Finish (${sets.length} sets)`}
            </button>
            <button className="btn-abort" onClick={handleAbort} disabled={busy}>
              <FiTrash2 /> Abort
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
