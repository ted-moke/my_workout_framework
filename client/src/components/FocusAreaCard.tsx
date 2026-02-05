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

function dueLabel(s: FocusAreaSuggestion): string {
  if (s.daysSinceLast === null) return "never done";
  const diff = s.daysSinceLast - s.focusArea.periodLengthDays;
  if (diff > 0) return `${Math.round(diff)}d overdue`;
  if (diff === 0) return "due today";
  return `due in ${Math.round(Math.abs(diff))}d`;
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
  const { focusArea, ptsFulfilled, priority } = suggestion;
  const pct = Math.min(100, Math.round((ptsFulfilled / focusArea.ptsPerPeriod) * 100));
  const isDue = priority > 0;

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
        <span className={`due-label${isDue ? " overdue-label" : " on-track-label"}`}>
          {dueLabel(suggestion)}
        </span>
        {areaSets.length > 0 && (
          <span className="group-badge">{areaSets.length}</span>
        )}
      </button>
      {open && (
        <>
          <div className={styles.focusAreaProgress}>
            <div className="progress-bar">
              <div
                className={`progress-fill${pct >= 100 ? " complete" : ""}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="due-pts">
              {ptsFulfilled} / {focusArea.ptsPerPeriod}{" "}
              {focusArea.ptsType === "active_minutes" ? "min" : "pts"}
            </span>
          </div>
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
