import { useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import type { FocusAreaSuggestion, SetWithDetails } from "../types";
import ExerciseRow from "./ExerciseRow";
import PointCubes from "./PointCubes";
import { areaColorVar } from "../areaColor";
import styles from "./FocusAreaCard.module.css";

interface Props {
  suggestion: FocusAreaSuggestion;
  sets: SetWithDetails[];
  isActive: boolean;
  defaultOpen?: boolean;
  onAddSet: (exerciseId: number, pts: number) => void;
  onRemoveSet: (setId: number) => void;
}

export default function FocusAreaCard({
  suggestion,
  sets,
  isActive,
  defaultOpen = false,
  onAddSet,
  onRemoveSet,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const { focusArea, ptsFulfilled } = suggestion;
  const areaColor = areaColorVar(focusArea.bodyArea.name);

  // Sum pts from current workout sets for this area
  const workoutPts = sets
    .filter((s) => suggestion.exercises.some((e) => e.id === s.exercise_id))
    .reduce((sum, s) => sum + s.pts, 0);

  const totalFulfilled = ptsFulfilled + workoutPts;
  const unit = focusArea.ptsType === "active_minutes" ? 15 : 1;

  return (
    <div className={styles.focusAreaCard}>
      <button className={styles.focusAreaHeader} onClick={() => setOpen(!open)}>
        <span className="group-arrow">{open ? <FiChevronDown /> : <FiChevronRight />}</span>
        <span className={styles.focusAreaName} style={{ color: areaColor }}>{focusArea.bodyArea.name}</span>
        <PointCubes
          fulfilled={totalFulfilled}
          goal={focusArea.ptsPerPeriod}
          color={areaColor}
          unit={unit}
          newPts={workoutPts}
          ptsExpiring1d={suggestion.ptsExpiring1d}
          ptsExpiring2d={suggestion.ptsExpiring2d}
        />
      </button>
      {open && (
        <>
          <div className={styles.focusAreaExercises}>
            {suggestion.exercises.map((ex) => (
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                sets={sets}
                ptsType={focusArea.ptsType}
                isActive={isActive}
                onAddSet={onAddSet}
                onRemoveSet={onRemoveSet}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
