import { useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import type { Exercise, ExerciseStats, RepRangeKey, SetDetails, SetWithDetails, PtsType } from "../types";
import { formatSetDetails, formatShortDay } from "../setDetails";
import SetDetailsInputs from "./SetDetailsInputs";
import styles from "./ExerciseRow.module.css";

const REP_RANGE_LABELS: { key: RepRangeKey; label: string }[] = [
  { key: "low", label: "1–5" },
  { key: "mid", label: "6–10" },
  { key: "high", label: "11+" },
];

interface Props {
  exercise: Exercise;
  sets: SetWithDetails[];
  stats?: ExerciseStats;
  ptsType: PtsType;
  isActive: boolean;
  onAddSet: (exerciseId: number, pts: number) => void;
  onRemoveSet: (setId: number) => void;
  onUpdateSetDetails: (setId: number, changes: SetDetails) => void;
}

export default function ExerciseRow({
  exercise,
  sets,
  stats,
  ptsType,
  isActive,
  onAddSet,
  onRemoveSet,
  onUpdateSetDetails,
}: Props) {
  // Tapping the name expands the row into a detail card with the past
  // weight/reps; the points buttons and weight/reps inputs sit outside the
  // toggle and work the same either way.
  const [expanded, setExpanded] = useState(false);
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
    <div className={`${styles.exerciseItem}${expanded ? ` ${styles.exerciseItemExpanded}` : ""}`}>
      <div className={styles.exerciseRow}>
        <button
          className={styles.exerciseName}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <span className={styles.exerciseTitle}>
            <span className={styles.expandArrow}>
              {expanded ? <FiChevronDown /> : <FiChevronRight />}
            </span>
            {exercise.name}
          </span>
          {exercise.daysSinceLast != null ? (
            <span className={styles.daysSince}>{exercise.daysSinceLast}d</span>
          ) : (
            <span className={styles.daysSince}>new</span>
          )}
        </button>
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
      {expanded && stats && (
        <div className={styles.exerciseStats}>
          <div className={styles.statLine}>
            <span className={styles.statLabel}>Max</span>
            <span className={styles.statValue}>{formatSetDetails(stats.max)}</span>
            <span className={styles.statDate}>{formatShortDay(stats.max.date)}</span>
          </div>
          {stats.last && (
            <div className={styles.statLine}>
              <span className={styles.statLabel}>
                {stats.last.isPrevious ? "Previous" : "Last"}
              </span>
              <span className={styles.statValue}>
                {stats.last.sets.map(formatSetDetails).join(", ")}
              </span>
              <span className={styles.statDate}>{formatShortDay(stats.last.date)}</span>
            </div>
          )}
          <div className={styles.detailHeading}>Best by reps</div>
          <div className={styles.rangeGrid}>
            {REP_RANGE_LABELS.map(({ key, label }) => {
              const best = stats.rangeMaxes[key];
              return (
                <div key={key} className={styles.rangeCell}>
                  <span className={styles.rangeLabel}>{label}</span>
                  <span className={styles.rangeValue}>
                    {best ? formatSetDetails(best) : "—"}
                  </span>
                  {best && (
                    <span className={styles.statDate}>{formatShortDay(best.date)}</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className={styles.detailHeading}>Recent sessions</div>
          {stats.history.map((h, i) => (
            <div key={i} className={styles.statLine}>
              <span className={styles.historyDate}>{formatShortDay(h.date)}</span>
              <span className={styles.statValue}>
                {h.sets.map(formatSetDetails).join(", ")}
              </span>
            </div>
          ))}
        </div>
      )}
      {expanded && !stats && (
        <div className={styles.noStats}>No weight or reps logged yet.</div>
      )}
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
