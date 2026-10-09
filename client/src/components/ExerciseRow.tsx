import type { Exercise, SetDetails, SetWithDetails, PtsType } from "../types";
import SetDetailsInputs from "./SetDetailsInputs";
import styles from "./ExerciseRow.module.css";

interface Props {
  exercise: Exercise;
  sets: SetWithDetails[];
  ptsType: PtsType;
  isActive: boolean;
  onAddSet: (exerciseId: number, pts: number) => void;
  onRemoveSet: (setId: number) => void;
  onUpdateSetDetails: (setId: number, changes: SetDetails) => void;
}

export default function ExerciseRow({
  exercise,
  sets,
  ptsType,
  isActive,
  onAddSet,
  onRemoveSet,
  onUpdateSetDetails,
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

  const loggedSets = isActive
    ? [...exerciseSets].sort((a, b) => a.pts - b.pts)
    : [];

  return (
    <div className={styles.exerciseItem}>
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
      {loggedSets.map((s) => (
        <div key={s.id} className={styles.setDetailsRow}>
          <span className={styles.setDetailsLabel}>
            {ptsType === "active_minutes" ? `${s.pts}m` : `${s.pts}pt`}
          </span>
          <SetDetailsInputs
            weight={s.weight}
            reps={s.reps}
            onChange={(changes) => onUpdateSetDetails(s.id, changes)}
          />
        </div>
      ))}
    </div>
  );
}
