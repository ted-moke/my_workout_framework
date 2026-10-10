import type { SetDetails } from "../types";
import { WEIGHT_UNIT, parseDetailInput } from "../setDetails";
import styles from "./SetDetailsInputs.module.css";

interface Props {
  weight: number | null;
  reps: number | null;
  onChange: (changes: SetDetails) => void;
}

// Optional weight and reps for one logged set. Saves on blur or Enter;
// clearing an input clears the value.
export default function SetDetailsInputs({ weight, reps, onChange }: Props) {
  const commit = (field: "weight" | "reps", text: string, current: number | null) => {
    const value = parseDetailInput(text, field === "reps");
    if (value === undefined || value === current) return;
    onChange({ [field]: value });
  };

  const blurOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };

  return (
    <div className={styles.setDetails}>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        className={styles.detailInput}
        placeholder="wt"
        aria-label={`Weight (${WEIGHT_UNIT})`}
        defaultValue={weight ?? ""}
        onBlur={(e) => commit("weight", e.target.value, weight)}
        onKeyDown={blurOnEnter}
      />
      <span className={styles.detailUnit}>{WEIGHT_UNIT} ×</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        className={styles.detailInput}
        placeholder="reps"
        aria-label="Reps"
        defaultValue={reps ?? ""}
        onBlur={(e) => commit("reps", e.target.value, reps)}
        onKeyDown={blurOnEnter}
      />
    </div>
  );
}
