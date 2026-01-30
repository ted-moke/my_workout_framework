import { useEffect, useState, useCallback } from "react";
import { fetchStatus, fetchDays, startWorkout, toggleExercise, finishWorkout, abortWorkout } from "../api";
import type { StatusResponse, ExerciseGroup, DayOption } from "../types";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function ExerciseGroupSection({
  group,
  selected,
  onToggle,
  defaultOpen,
  disabled,
}: {
  group: ExerciseGroup;
  selected: Set<number>;
  onToggle: (id: number) => void;
  defaultOpen: boolean;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const count = group.exercises.filter((ex) => selected.has(ex.id)).length;

  return (
    <div className="exercise-group">
      <button className="group-header" onClick={() => setOpen(!open)}>
        <span className="group-arrow">{open ? "\u25BC" : "\u25B6"}</span>
        <span className="group-name">{group.focusArea.name}</span>
        {count > 0 && <span className="group-badge">{count}</span>}
      </button>
      {open && (
        <div className="group-body">
          {group.exercises.map((ex) => (
            <label key={ex.id} className={`exercise-item${disabled ? " disabled" : ""}`}>
              <input
                type="checkbox"
                checked={selected.has(ex.id)}
                onChange={() => onToggle(ex.id)}
                disabled={disabled}
              />
              <span className="exercise-name">{ex.name}</span>
              <span className="exercise-ago">{timeAgo(ex.last_done)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Dashboard({ onWorkoutLogged }: { onWorkoutLogged?: () => void }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [workoutId, setWorkoutId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [days, setDays] = useState<DayOption[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [workoutDate, setWorkoutDate] = useState(todayStr());
  const [autoDayNumber, setAutoDayNumber] = useState<number | null>(null);

  const load = useCallback((dayNumber?: number) => {
    fetchStatus(dayNumber)
      .then((data) => {
        setStatus(data);
        if (data.activeWorkout) {
          setWorkoutId(data.activeWorkout.id);
          setSelected(new Set(data.activeExerciseIds));
        } else {
          setWorkoutId(null);
          setSelected(new Set());
          // Set auto-calculated day only on initial load
          if (!dayNumber) {
            setAutoDayNumber(data.nextDay.day_number);
            setSelectedDay(data.nextDay.day_number);
          }
        }
      })
      .catch(() => setError("Failed to load status"));
  }, []);

  useEffect(() => {
    load();
    fetchDays()
      .then(setDays)
      .catch(() => {});
  }, [load]);

  const isActive = workoutId !== null;

  const handleDaySelect = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    load(dayNumber);
  };

  const handleStart = async () => {
    if (!status) return;
    setBusy(true);
    try {
      const result = await startWorkout(status.nextDay.day_id, workoutDate);
      setWorkoutId(result.id);
      setSelected(new Set());
    } catch {
      setError("Failed to start workout");
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (exerciseId: number) => {
    if (workoutId === null) return;
    // Optimistic update
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
    try {
      await toggleExercise(workoutId, exerciseId);
    } catch {
      // Revert on failure
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(exerciseId)) next.delete(exerciseId);
        else next.add(exerciseId);
        return next;
      });
      setError("Failed to save exercise");
    }
  };

  const handleFinish = async () => {
    if (workoutId === null) return;
    setBusy(true);
    try {
      await finishWorkout(workoutId);
      onWorkoutLogged?.();
      setSelectedDay(null);
      setAutoDayNumber(null);
      setWorkoutDate(todayStr());
      load();
    } catch {
      setError("Failed to finish workout");
    } finally {
      setBusy(false);
    }
  };

  const handleAbort = async () => {
    if (workoutId === null) return;
    if (!confirm("Abort this workout? All progress will be discarded.")) return;
    setBusy(true);
    try {
      await abortWorkout(workoutId);
      setSelectedDay(null);
      setAutoDayNumber(null);
      setWorkoutDate(todayStr());
      load();
    } catch {
      setError("Failed to abort workout");
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="error">{error}</div>;
  if (!status) return <div className="loading">Loading...</div>;

  const { nextDay, allExerciseGroups } = status;
  const todayGroups = allExerciseGroups.filter((g) => g.focusArea.isForToday);
  const otherGroups = allExerciseGroups.filter((g) => !g.focusArea.isForToday);

  return (
    <div className="dashboard">
      <div className="card">
        <div className="day-header">
          <h2>
            {isActive ? "Workout in Progress" : "Next"}: Day {nextDay.day_number}
          </h2>
          {isActive && <span className="active-badge">LIVE</span>}
        </div>
        <p className="focus-labels">
          {nextDay.focus_areas.map((fa) => fa.name).join(" · ")}
        </p>

        {isActive && (
          <p className="save-hint">Exercises are saved as you check them.</p>
        )}

        <div className="exercise-list">
          {todayGroups.map((group) => (
            <ExerciseGroupSection
              key={group.focusArea.id}
              group={group}
              selected={selected}
              onToggle={handleToggle}
              defaultOpen={true}
              disabled={!isActive}
            />
          ))}
        </div>

        {!isActive && days.length > 0 && (
          <div className="day-selector">
            <label className="selector-label">Day</label>
            <div className="day-buttons">
              {days.map((d) => (
                <button
                  key={d.day_number}
                  className={`day-btn${selectedDay === d.day_number ? " active" : ""}${autoDayNumber === d.day_number ? " suggested" : ""}`}
                  onClick={() => handleDaySelect(d.day_number)}
                >
                  <span className="day-btn-number">Day {d.day_number}</span>
                  <span className="day-btn-focus">{d.focus_areas.map((fa) => fa.name).join(", ")}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!isActive && (
          <div className="date-picker-row">
            <label className="selector-label" htmlFor="workout-date">Date</label>
            <input
              id="workout-date"
              type="date"
              className="date-input"
              value={workoutDate}
              max={todayStr()}
              onChange={(e) => setWorkoutDate(e.target.value)}
            />
          </div>
        )}

        {!isActive ? (
          <button className="btn-primary" onClick={handleStart} disabled={busy}>
            {busy ? "Starting..." : "Start Workout"}
          </button>
        ) : (
          <div className="workout-actions">
            <button
              className="btn-finish"
              onClick={handleFinish}
              disabled={busy || selected.size === 0}
            >
              {busy ? "Finishing..." : `Finish Workout (${selected.size} exercises)`}
            </button>
            <button className="btn-abort" onClick={handleAbort} disabled={busy}>
              Abort
            </button>
          </div>
        )}
      </div>

      {otherGroups.length > 0 && (
        <div className="card">
          <h2>Other Exercises</h2>
          <div className="exercise-list">
            {otherGroups.map((group) => (
              <ExerciseGroupSection
                key={group.focusArea.id}
                group={group}
                selected={selected}
                onToggle={handleToggle}
                defaultOpen={false}
                disabled={!isActive}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
