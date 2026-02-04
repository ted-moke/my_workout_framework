import type { Exercise, SetWithDetails, PtsType } from "../types";
import SetBadge from "./SetBadge";
import AddSetControl from "./AddSetControl";
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
  const totalPts = exerciseSets.reduce((sum, s) => sum + s.pts, 0);

  return (
    <div className={styles.exerciseRow}>
      <div className={styles.exerciseRowHeader}>
        <span className={styles.exerciseName}>{exercise.name}</span>
        {exerciseSets.length > 0 && (
          <span className={styles.exerciseTotal}>
            {totalPts} {ptsType === "active_minutes" ? "min" : "pts"}
          </span>
        )}
      </div>
      {exerciseSets.length > 0 && (
        <div className={styles.exerciseSets}>
          {exerciseSets.map((s) => (
            <SetBadge
              key={s.id}
              pts={s.pts}
              ptsType={ptsType}
              onRemove={() => onRemoveSet(s.id)}
              disabled={!isActive}
            />
          ))}
        </div>
      )}
      {isActive && (
        <AddSetControl
          ptsType={ptsType}
          onAdd={(pts) => onAddSet(exercise.id, pts)}
        />
      )}
    </div>
  );
}
