import { useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import type { FocusAreaSuggestion, SetWithDetails } from "../types";
import ExerciseRow from "./ExerciseRow";
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
  const { focusArea } = suggestion;

  // Count sets in this body area for the current workout
  const areaSets = sets.filter(
    (s) =>
      suggestion.exercises.some((e) => e.id === s.exercise_id)
  );

  return (
    <div className={styles.focusAreaCard}>
      <button className={styles.focusAreaHeader} onClick={() => setOpen(!open)}>
        <span className="group-arrow">{open ? <FiChevronDown /> : <FiChevronRight />}</span>
        <span className={styles.focusAreaName} style={{ color: areaColorVar(focusArea.bodyArea.name) }}>{focusArea.bodyArea.name}</span>
        {areaSets.length > 0 && (
          <span className="group-badge">{areaSets.length}</span>
        )}
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
