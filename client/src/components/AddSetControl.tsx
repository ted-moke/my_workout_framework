import { useState } from "react";
import type { PtsType } from "../types";
import styles from "./AddSetControl.module.css";

interface Props {
  ptsType: PtsType;
  onAdd: (pts: number) => void;
  disabled?: boolean;
}

export default function AddSetControl({ ptsType, onAdd, disabled }: Props) {
  const [customValue, setCustomValue] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  if (ptsType === "active_minutes") {
    const presets = [15, 30, 45, 60];
    return (
      <div className={styles.addSetControl}>
        <div className={styles.setPresets}>
          {presets.map((m) => (
            <button
              key={m}
              className={styles.setPresetBtn}
              onClick={() => onAdd(m)}
              disabled={disabled}
            >
              {m}m
            </button>
          ))}
          {!showCustom ? (
            <button
              className={`${styles.setPresetBtn} ${styles.custom}`}
              onClick={() => setShowCustom(true)}
              disabled={disabled}
            >
              ...
            </button>
          ) : (
            <form
              className={styles.customPtsForm}
              onSubmit={(e) => {
                e.preventDefault();
                const val = parseInt(customValue, 10);
                if (val > 0) {
                  onAdd(val);
                  setCustomValue("");
                  setShowCustom(false);
                }
              }}
            >
              <input
                type="number"
                min="1"
                className={styles.customPtsInput}
                placeholder="min"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                autoFocus
              />
              <button type="submit" className={styles.setPresetBtn} disabled={disabled}>
                +
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Effort type: 1/2/3 presets with custom option
  return (
    <div className={styles.addSetControl}>
      <div className={styles.setPresets}>
        {[1, 2, 3].map((p) => (
          <button
            key={p}
            className={styles.setPresetBtn}
            onClick={() => onAdd(p)}
            disabled={disabled}
            title={p === 1 ? "Light" : p === 2 ? "Moderate" : "Hard"}
          >
            {p}
          </button>
        ))}
        {!showCustom ? (
          <button
            className={`${styles.setPresetBtn} ${styles.custom}`}
            onClick={() => setShowCustom(true)}
            disabled={disabled}
          >
            ...
          </button>
        ) : (
          <form
            className={styles.customPtsForm}
            onSubmit={(e) => {
              e.preventDefault();
              const val = parseInt(customValue, 10);
              if (val > 0) {
                onAdd(val);
                setCustomValue("");
                setShowCustom(false);
              }
            }}
          >
            <input
              type="number"
              min="1"
              className={styles.customPtsInput}
              placeholder="pts"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              autoFocus
            />
            <button type="submit" className={styles.setPresetBtn} disabled={disabled}>
              +
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
