import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2, FiX, FiCheck, FiPlus, FiChevronDown, FiChevronRight } from "react-icons/fi";
import {
  fetchHistory,
  fetchExercises,
  fetchSuggestions,
  updateWorkoutDate,
  updateSet,
  removeSet,
  addSet,
  deleteWorkout,
} from "../api";
import { useUser } from "../UserContext";
import type { WorkoutWithSets, SetWithDetails, Exercise, PtsType } from "../types";
import PointCubes from "./PointCubes";
import { areaColorVar } from "../areaColor";
import styles from "./History.module.css";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  console.log('formatRelativeDate', dateStr, date, now);
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  // Calculate Monday of this week
  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayThisWeek = new Date(now);
  mondayThisWeek.setDate(now.getDate() - daysToMonday);
  mondayThisWeek.setHours(0, 0, 0, 0);

  // Calculate Monday of last week
  const mondayLastWeek = new Date(mondayThisWeek);
  mondayLastWeek.setDate(mondayThisWeek.getDate() - 7);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  if (date >= mondayThisWeek) {
    return days[date.getDay()];
  } else if (date >= mondayLastWeek) {
    return "Last " + days[date.getDay()];
  } else {
    return `${diffDays} days ago`;
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

function groupSetsForEdit(
  sets: SetWithDetails[]
): { area: string; sets: SetWithDetails[] }[] {
  const grouped = new Map<string, SetWithDetails[]>();
  for (const s of sets) {
    const arr = grouped.get(s.body_area_name) ?? [];
    arr.push(s);
    grouped.set(s.body_area_name, arr);
  }
  return Array.from(grouped.entries()).map(([area, sets]) => ({ area, sets }));
}

export default function History({ refreshKey }: { refreshKey?: number }) {
  const { user } = useUser();
  const [logs, setLogs] = useState<WorkoutWithSets[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<(Exercise & { body_area_name: string })[]>([]);
  const [addExerciseId, setAddExerciseId] = useState<number | null>(null);
  const [addPts, setAddPts] = useState("");
  const [error, setError] = useState("");
  const [ptsTypeByArea, setPtsTypeByArea] = useState<Map<string, PtsType>>(new Map());

  useEffect(() => {
    if (!user) return;
    fetchHistory(user.id)
      .then(setLogs)
      .catch(() => setError("Failed to load history"));
    fetchSuggestions(user.id)
      .then((data) => {
        const map = new Map<string, PtsType>();
        for (const s of data.suggestions) {
          map.set(s.focusArea.bodyArea.name, s.focusArea.ptsType);
        }
        setPtsTypeByArea(map);
      })
      .catch(() => {});
  }, [user, refreshKey]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const enterEdit = async (id: number) => {
    if (exercises.length === 0) {
      try {
        const exs = await fetchExercises();
        setExercises(exs);
      } catch {
        // silently fail, user can still edit existing sets
      }
    }
    setEditingId(id);
    setAddExerciseId(null);
    setAddPts("");
  };

  const exitEdit = () => {
    setEditingId(null);
    setAddExerciseId(null);
    setAddPts("");
  };

  const handleDateChange = async (workoutId: number, newDate: string) => {
    try {
      const updated = await updateWorkoutDate(workoutId, newDate);
      setLogs((prev) =>
        prev.map((w) => (w.id === workoutId ? { ...w, workout_date: updated.workout_date } : w))
      );
      console.log("Date updated");
    } catch {
      // revert not needed since input is controlled by logs state
    }
  };

  useEffect(() => {

    console.log('logs updated', logs);
  }, [logs]);

  const handleUpdateSet = async (workoutId: number, setId: number, newPts: number) => {
    try {
      await updateSet(setId, newPts);
      setLogs((prev) =>
        prev.map((w) =>
          w.id === workoutId
            ? { ...w, sets: w.sets.map((s) => (s.id === setId ? { ...s, pts: newPts } : s)) }
            : w
        )
      );
    } catch {
      // keep old value on failure
    }
  };

  const handleRemoveSet = async (workoutId: number, setId: number) => {
    try {
      await removeSet(setId);
      setLogs((prev) =>
        prev.map((w) =>
          w.id === workoutId ? { ...w, sets: w.sets.filter((s) => s.id !== setId) } : w
        )
      );
    } catch {
      // no-op
    }
  };

  const handleAddSet = async (workoutId: number) => {
    if (!addExerciseId || !addPts) return;
    const pts = parseInt(addPts, 10);
    if (isNaN(pts) || pts < 0) return;

    try {
      const newSet = await addSet(workoutId, addExerciseId, pts);
      const ex = exercises.find((e) => e.id === addExerciseId);
      const setWithDetails: SetWithDetails = {
        ...newSet,
        exercise_name: ex?.name ?? "Unknown",
        body_area_name: ex?.body_area_name ?? "Unknown",
      };
      setLogs((prev) =>
        prev.map((w) =>
          w.id === workoutId ? { ...w, sets: [...w.sets, setWithDetails] } : w
        )
      );
      setAddPts("");
    } catch {
      // no-op
    }
  };

  const handleDeleteWorkout = async (workoutId: number) => {
    if (!window.confirm("Delete this workout? This cannot be undone.")) return;
    try {
      await deleteWorkout(workoutId);
      setLogs((prev) => prev.filter((w) => w.id !== workoutId));
      setEditingId(null);
    } catch {
      // no-op
    }
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
      <div className={styles.historyList}>
        {logs.map((log, idx) => {
          const areas = groupSetsByArea(log);
          const isExpanded = expanded.has(log.id);
          const isEditing = editingId === log.id;
          let missedDays = 0;
          if (idx > 0) {
            const prev = new Date(logs[idx - 1].workout_date);
            const curr = new Date(log.workout_date);
            missedDays = Math.max(0, Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)) - 1);
          }
          return (
            <div key={log.id}>
              {missedDays > 0 && (
                <div className={styles.dayGap}>
                  {Array.from({ length: Math.min(missedDays, 7) }, (_, i) => (
                    <span key={i} className={styles.dayGapDot} />
                  ))}
                </div>
              )}
              <div className={styles.historyItem}>
              <button
                className={styles.historyHeader}
                onClick={() => toggleExpand(log.id)}
              >
                <span className={styles.historyDate}>
                  {formatRelativeDate(log.workout_date)}
                </span>
                <span className={styles.historyAreas}>
                  {areas.map((a) => (
                    <PointCubes
                      key={a.area}
                      fulfilled={a.totalPts}
                      goal={a.totalPts}
                      color={areaColorVar(a.area)}
                      unit={ptsTypeByArea.get(a.area) === "active_minutes" ? 15 : 1}
                    />
                  ))}
                </span>
                <span className="group-arrow">
                  {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                </span>
              </button>
              {isExpanded && !isEditing && (
                <div className={styles.historyDetails}>
                  <div className={styles.historyFullDate}>
                    <small>{formatDate(log.workout_date)}</small>
                    <div className={styles.historyDetailActions}>
                      <button
                        className={styles.iconBtn}
                        onClick={() => enterEdit(log.id)}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => handleDeleteWorkout(log.id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  {areas.map((a) => (
                    <div key={a.area} className={styles.historyAreaGroup}>
                      <div className={styles.historyAreaHeader}>
                        <span style={{ color: areaColorVar(a.area) }}>{a.area}</span>
                        <span className={styles.historyAreaPts}>
                          {a.totalPts} pts
                        </span>
                      </div>
                      <div className={styles.historyExercises}>
                        {a.exercises.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isExpanded && isEditing && (
                <div className={styles.historyDetails}>
                  {/* Date edit */}
                  <div className={styles.historyEditDate}>
                    <label>Date:</label>
                    <input
                      type="date"
                      className="date-input"
                      value={log.workout_date}
                      onChange={(e) => handleDateChange(log.id, e.target.value)}
                    />
                  </div>

                  {/* Sets by area */}
                  {groupSetsForEdit(log.sets).map((group) => (
                    <div key={group.area} className={styles.historyAreaGroup}>
                      <div className={styles.historyAreaHeader}>
                        <span style={{ color: areaColorVar(group.area) }}>{group.area}</span>
                      </div>
                      {group.sets.map((s) => (
                        <div key={s.id} className={styles.historyEditSet}>
                          <span className={styles.historyEditSetName}>
                            {s.exercise_name}
                          </span>
                          <input
                            type="number"
                            className={styles.historyEditSetPts}
                            defaultValue={s.pts}
                            min={0}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 0 && val !== s.pts) {
                                handleUpdateSet(log.id, s.id, val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                          />
                          <span className={styles.historyEditSetUnit}>pts</span>
                          <button
                            className="set-badge-remove"
                            onClick={() => handleRemoveSet(log.id, s.id)}
                            title="Remove set"
                          >
                            <FiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Add set */}
                  {exercises.length > 0 && (
                    <div className={styles.historyAddSet}>
                      <select
                        value={addExerciseId ?? ""}
                        onChange={(e) => setAddExerciseId(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">Add exercise…</option>
                        {exercises.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name} ({ex.body_area_name})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className={styles.historyAddSetPts}
                        placeholder="pts"
                        min={0}
                        value={addPts}
                        onChange={(e) => setAddPts(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddSet(log.id);
                        }}
                      />
                      <button
                        className="btn-small"
                        disabled={!addExerciseId || !addPts}
                        onClick={() => handleAddSet(log.id)}
                      >
                        <FiPlus />
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className={styles.historyEditActions}>
                    <button
                      className="btn-abort"
                      onClick={() => handleDeleteWorkout(log.id)}
                    >
                      <FiTrash2 /> Delete
                    </button>
                    <button className="btn-primary" onClick={exitEdit}>
                      <FiCheck /> Done
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
