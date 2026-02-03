import { useState } from "react";
import type { PtsType } from "../types";

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
      <div className="add-set-control">
        <div className="set-presets">
          {presets.map((m) => (
            <button
              key={m}
              className="set-preset-btn"
              onClick={() => onAdd(m)}
              disabled={disabled}
            >
              {m}m
            </button>
          ))}
          {!showCustom ? (
            <button
              className="set-preset-btn custom"
              onClick={() => setShowCustom(true)}
              disabled={disabled}
            >
              ...
            </button>
          ) : (
            <form
              className="custom-pts-form"
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
                className="custom-pts-input"
                placeholder="min"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                autoFocus
              />
              <button type="submit" className="set-preset-btn" disabled={disabled}>
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
    <div className="add-set-control">
      <div className="set-presets">
        {[1, 2, 3].map((p) => (
          <button
            key={p}
            className="set-preset-btn"
            onClick={() => onAdd(p)}
            disabled={disabled}
            title={p === 1 ? "Light" : p === 2 ? "Moderate" : "Hard"}
          >
            {p}
          </button>
        ))}
        {!showCustom ? (
          <button
            className="set-preset-btn custom"
            onClick={() => setShowCustom(true)}
            disabled={disabled}
          >
            ...
          </button>
        ) : (
          <form
            className="custom-pts-form"
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
              className="custom-pts-input"
              placeholder="pts"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              autoFocus
            />
            <button type="submit" className="set-preset-btn" disabled={disabled}>
              +
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
