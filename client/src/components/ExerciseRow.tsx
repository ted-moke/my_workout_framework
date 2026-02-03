import type { Exercise, SetWithDetails, PtsType } from "../types";
import SetBadge from "./SetBadge";
import AddSetControl from "./AddSetControl";

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
    <div className="exercise-row">
      <div className="exercise-row-header">
        <span className="exercise-name">{exercise.name}</span>
        {exerciseSets.length > 0 && (
          <span className="exercise-total">
            {totalPts} {ptsType === "active_minutes" ? "min" : "pts"}
          </span>
        )}
      </div>
      {exerciseSets.length > 0 && (
        <div className="exercise-sets">
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
