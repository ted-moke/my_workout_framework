import type { Exercise, SetWithDetails, PtsType } from "../types";
import styles from "./ExerciseRow.module.css";

interface Props {
  exercise: Exercise;
  sets: SetWithDetails[];
  ptsType: PtsType;
  isActive: boolean;
  onAddSet: (exerciseId: number, pts: number) => void;
  onRemoveSet: (setId: number) => void;
}

export default function ExerciseRow({
  exercise,
  sets,
  ptsType,
  isActive,
  onAddSet,
  onRemoveSet,
}: Props) {
  const exerciseSets = sets.filter((s) => s.exercise_id === exercise.id);

  // For effort type, find which point values are currently selected
  const selectedPts = new Set(exerciseSets.map((s) => s.pts));

  const handleToggle = (pts: number) => {
    // Find a set with this pts value to remove, or add a new one
    const existingSet = exerciseSets.find((s) => s.pts === pts);
    if (existingSet) {
      onRemoveSet(existingSet.id);
    } else {
      onAddSet(exercise.id, pts);
    }
  };

  const presets = ptsType === "active_minutes" ? [15, 30, 45, 60] : [1, 2, 3];

  return (
    <div className={styles.exerciseRow}>
      <span className={styles.exerciseName}>
        {exercise.name}
        {exercise.daysSinceLast != null ? (
          <span className={styles.daysSince}>{exercise.daysSinceLast}d</span>
        ) : (
          <span className={styles.daysSince}>new</span>
        )}
      </span>
      {isActive && (
        <div className={styles.exerciseButtons}>
          {presets.map((p) => (
            <button
              key={p}
              className={`${styles.ptsBtn}${selectedPts.has(p) ? ` ${styles.ptsBtnSelected}` : ""}`}
              onClick={() => handleToggle(p)}
            >
              {ptsType === "active_minutes" ? `${p}m` : p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
