import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import styles from "./AddExerciseControl.module.css";

interface Props {
  // Names already in the list, to catch duplicates before creating one.
  existingNames: string[];
  onCreate: (name: string) => Promise<void>;
}

// "+ Add exercise" at the bottom of a focus area: creates a new exercise in
// that area on the spot, e.g. to log something unplanned mid-workout.
export default function AddExerciseControl({ existingNames, onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    setOpen(false);
    setName("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setError("Already in this list");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onCreate(trimmed);
      close();
    } catch {
      setError("Failed to add exercise");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button className={styles.addExerciseBtn} onClick={() => setOpen(true)}>
        <FiPlus /> Add exercise
      </button>
    );
  }

  return (
    <form className={styles.addExerciseForm} onSubmit={handleSubmit}>
      <div className={styles.addExerciseRow}>
        <input
          className={styles.nameInput}
          placeholder="Exercise name"
          aria-label="New exercise name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && close()}
          autoFocus
          disabled={saving}
        />
        <button type="submit" className="btn-small" disabled={saving || !name.trim()}>
          {saving ? "Adding..." : "Add"}
        </button>
        <button type="button" className="btn-small" onClick={close} disabled={saving}>
          Cancel
        </button>
      </div>
      {error && <div className={styles.addExerciseError}>{error}</div>}
    </form>
  );
}
