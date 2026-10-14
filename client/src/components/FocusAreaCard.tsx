import { useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import type { Exercise, ExerciseStats, FocusAreaSuggestion, SetDetails, SetWithDetails } from "../types";
import ExerciseRow from "./ExerciseRow";
import AddExerciseControl from "./AddExerciseControl";
import PointCubes from "./PointCubes";
import { areaColorVar } from "../areaColor";
import styles from "./FocusAreaCard.module.css";

interface Props {
  suggestion: FocusAreaSuggestion;
  sets: SetWithDetails[];
  stats: Record<number, ExerciseStats>;
  isActive: boolean;
  defaultOpen?: boolean;
  onAddSet: (exerciseId: number, pts: number) => void;
  onRemoveSet: (setId: number) => void;
  onUpdateSet: (setId: number, pts: number) => void;
  onUpdateSetDetails: (setId: number, changes: SetDetails) => void;
  // All exercises in this body area, including ones hidden at this location.
  areaExercises: Exercise[];
  onCreateExercise: (bodyAreaId: number, name: string) => Promise<void>;
}

export default function FocusAreaCard({
  suggestion,
  sets,
  stats,
  isActive,
  defaultOpen = false,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onUpdateSetDetails,
  areaExercises,
  onCreateExercise,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const { focusArea, ptsFulfilled } = suggestion;
  const areaColor = areaColorVar(focusArea.bodyArea.name);

  const placeholder = suggestion.exercises.find((e) => e.is_placeholder);
  const regularExercises = suggestion.exercises.filter((e) => !e.is_placeholder);

  // Sum pts from current workout sets for this area
  const workoutPts = sets
    .filter((s) => suggestion.exercises.some((e) => e.id === s.exercise_id))
    .reduce((sum, s) => sum + s.pts, 0);

  const totalFulfilled = ptsFulfilled + workoutPts;
  const unit = focusArea.ptsType === "active_minutes" ? 15 : 1;
  const placeholderSets = placeholder
    ? sets.filter((s) => s.exercise_id === placeholder.id)
    : [];
  // For effort type: [1] and [2] are toggles, extraSet handles 3+ (incrementable)
  const extraSet = focusArea.ptsType === "effort"
    ? placeholderSets.find((s) => s.pts >= 3)
    : undefined;

  return (
    <div className={styles.focusAreaCard}>
      <div className={styles.focusAreaHeader}>
        <button className={styles.focusAreaToggle} onClick={() => setOpen(!open)}>
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
        {isActive && placeholder && (
          <div className={styles.quickLogButtons}>
            {focusArea.ptsType === "effort" ? (
              <>
                {[1, 2].map((p) => {
                  const s = placeholderSets.find((set) => set.pts === p);
                  return (
                    <button
                      key={p}
                      className={`${styles.quickLogBtn}${s ? ` ${styles.quickLogBtnSelected}` : ""}`}
                      onClick={() => s ? onRemoveSet(s.id) : onAddSet(placeholder.id, p)}
                    >
                      {p}
                    </button>
                  );
                })}
                {extraSet ? (
                  <>
                    <button
                      className={`${styles.quickLogBtn} ${styles.quickLogBtnSelected}`}
                      onClick={() =>
                        extraSet.pts === 3
                          ? onRemoveSet(extraSet.id)
                          : onUpdateSet(extraSet.id, extraSet.pts - 1)
                      }
                    >
                      {extraSet.pts}
                    </button>
                    <button
                      className={`${styles.quickLogBtn} ${styles.quickLogBtnSelected} ${styles.quickLogIncrement}`}
                      onClick={() => onUpdateSet(extraSet.id, extraSet.pts + 1)}
                    >
                      +
                    </button>
                  </>
                ) : (
                  <button
                    className={styles.quickLogBtn}
                    onClick={() => onAddSet(placeholder.id, 3)}
                  >
                    +
                  </button>
                )}
              </>
            ) : (
              [15, 30, 45, 60].map((p) => {
                const s = placeholderSets.find((set) => set.pts === p);
                return (
                  <button
                    key={p}
                    className={`${styles.quickLogBtn}${s ? ` ${styles.quickLogBtnSelected}` : ""}`}
                    onClick={() => s ? onRemoveSet(s.id) : onAddSet(placeholder.id, p)}
                  >
                    {p}m
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
      {open && (
        <div className={styles.focusAreaExercises}>
          {regularExercises.map((ex) => (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              sets={sets}
              stats={stats[ex.id]}
              ptsType={focusArea.ptsType}
              isActive={isActive}
              onAddSet={onAddSet}
              onRemoveSet={onRemoveSet}
              onUpdateSetDetails={onUpdateSetDetails}
            />
          ))}
          <AddExerciseControl
            existing={areaExercises.map((e) => ({
              name: e.name,
              hidden: !suggestion.exercises.some((s) => s.id === e.id),
            }))}
            onCreate={(name) => onCreateExercise(focusArea.bodyArea.id, name)}
          />
        </div>
      )}
    </div>
  );
}
