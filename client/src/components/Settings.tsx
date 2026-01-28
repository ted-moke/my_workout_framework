import { useEffect, useState } from "react";
import { fetchSettings, updateSettings } from "../api";

export default function Settings() {
  const [exercisesPerFocus, setExercisesPerFocus] = useState(2);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        if (s.exercises_per_focus_area != null) {
          setExercisesPerFocus(s.exercises_per_focus_area as number);
        }
      })
      .catch(() => setError("Failed to load settings"));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateSettings({ exercises_per_focus_area: exercisesPerFocus });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="card">
      <h2>Settings</h2>
      <div className="setting-row">
        <label htmlFor="epf">Exercises per focus area</label>
        <select
          id="epf"
          value={exercisesPerFocus}
          onChange={(e) => setExercisesPerFocus(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <button className="btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : saved ? "Saved!" : "Save"}
      </button>
    </div>
  );
}
