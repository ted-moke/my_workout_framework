import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import {
  fetchExercises,
  fetchBodyAreas,
  createExercise,
  updateExercise,
  deleteExercise,
  createBodyArea,
  updateBodyArea,
  deleteBodyArea,
} from "../api";
import type { BodyArea, Exercise } from "../types";
import { areaColorVar } from "../areaColor";
import styles from "./Exercises.module.css";

type ExerciseWithArea = Exercise & { body_area_name: string };

export default function Exercises() {
  const [exercises, setExercises] = useState<ExerciseWithArea[]>([]);
  const [bodyAreas, setBodyAreas] = useState<BodyArea[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [editName, setEditName] = useState("");
  const [editBodyAreaId, setEditBodyAreaId] = useState(0);
  const [busy, setBusy] = useState(false);

  // Body area editing state
  const [editingArea, setEditingArea] = useState<number | "new" | null>(null);
  const [editAreaName, setEditAreaName] = useState("");
  const [areaError, setAreaError] = useState("");

  useEffect(() => {
    fetchExercises().then(setExercises).catch(() => setError("Failed to load exercises"));
    fetchBodyAreas().then(setBodyAreas).catch(() => {});
  }, []);

  const startEdit = (ex: ExerciseWithArea) => {
    setEditing(ex.id);
    setEditName(ex.name);
    setEditBodyAreaId(ex.body_area_id);
  };

  const startNew = () => {
    setEditing("new");
    setEditName("");
    setEditBodyAreaId(0);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditName("");
    setEditBodyAreaId(0);
  };

  const handleSave = async () => {
    if (!editName.trim() || editBodyAreaId === 0) return;

    setBusy(true);
    setError("");
    try {
      if (editing === "new") {
        await createExercise(editName.trim(), editBodyAreaId);
      } else if (typeof editing === "number") {
        await updateExercise(editing, editName.trim(), editBodyAreaId);
      }
      const updated = await fetchExercises();
      setExercises(updated);
      cancelEdit();
    } catch {
      setError("Failed to save exercise");
    } finally {
      setBusy(false);
    }
  };

  // Body area handlers
  const startEditArea = (ba: BodyArea) => {
    setEditingArea(ba.id);
    setEditAreaName(ba.name);
    setAreaError("");
  };

  const startNewArea = () => {
    setEditingArea("new");
    setEditAreaName("");
    setAreaError("");
  };

  const cancelEditArea = () => {
    setEditingArea(null);
    setEditAreaName("");
    setAreaError("");
  };

  const handleSaveArea = async () => {
    if (!editAreaName.trim()) return;

    setBusy(true);
    setAreaError("");
    try {
      if (editingArea === "new") {
        await createBodyArea(editAreaName.trim());
      } else if (typeof editingArea === "number") {
        await updateBodyArea(editingArea, editAreaName.trim());
      }
      const updated = await fetchBodyAreas();
      setBodyAreas(updated);
      // Re-fetch exercises too since body_area_name may have changed
      const updatedExercises = await fetchExercises();
      setExercises(updatedExercises);
      cancelEditArea();
    } catch {
      setAreaError("Failed to save body area");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteArea = async (id: number) => {
    if (!confirm("Delete this body area?")) return;
    setBusy(true);
    setAreaError("");
    try {
      await deleteBodyArea(id);
      const updated = await fetchBodyAreas();
      setBodyAreas(updated);
    } catch (err) {
      setAreaError(err instanceof Error ? err.message : "Failed to delete body area");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this exercise?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteExercise(id);
      const updated = await fetchExercises();
      setExercises(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete exercise");
    } finally {
      setBusy(false);
    }
  };

  // Group exercises by body area
  const grouped = exercises.reduce<Record<string, ExerciseWithArea[]>>((acc, ex) => {
    const key = ex.body_area_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ex);
    return acc;
  }, {});

  if (error) return <div className="error">{error}</div>;

  // Editing view
  if (editing !== null) {
    return (
      <div className="card">
        <h2>{editing === "new" ? "New Exercise" : "Edit Exercise"}</h2>
        <div className={styles.exerciseEditor}>
          <div className={styles.fieldRow}>
            <label>Exercise Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Bench Press"
            />
          </div>
          <div className={styles.fieldRow}>
            <label>Body Area</label>
            <select
              value={editBodyAreaId}
              onChange={(e) => setEditBodyAreaId(parseInt(e.target.value, 10))}
            >
              <option value={0}>Select body area...</option>
              {bodyAreas.map((ba) => (
                <option key={ba.id} value={ba.id}>
                  {ba.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.editorActions}>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={busy || !editName.trim() || editBodyAreaId === 0}
            >
              {busy ? "Saving..." : "Save Exercise"}
            </button>
            <button className="btn-abort" onClick={cancelEdit} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <>
      <div className="card">
        <div className={styles.header}>
          <h2>Exercises</h2>
          <button
            className={`${styles.iconBtn} ${styles.addBtn}`}
            onClick={startNew}
            title="Add exercise"
          >
            <FiPlus />
          </button>
        </div>
        {exercises.length === 0 ? (
          <p className="muted">No exercises yet. Tap + to create one.</p>
        ) : (
          <div className={styles.exerciseList}>
            {Object.entries(grouped).map(([areaName, exs]) => (
              <div key={areaName} className={styles.group}>
                <div className={styles.groupLabel} style={{ color: areaColorVar(areaName) }}>{areaName}</div>
                {exs.map((ex) => (
                  <div key={ex.id} className={styles.exerciseRow}>
                    <span className={styles.exerciseName}>{ex.name}</span>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.iconBtn}
                        onClick={() => startEdit(ex)}
                        disabled={busy}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => handleDelete(ex.id)}
                        disabled={busy}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className={styles.header}>
          <h2>Body Areas</h2>
          <button
            className={`${styles.iconBtn} ${styles.addBtn}`}
            onClick={startNewArea}
            title="Add body area"
          >
            <FiPlus />
          </button>
        </div>
        {areaError && <p className="error">{areaError}</p>}
        {bodyAreas.length === 0 ? (
          <p className="muted">No body areas yet. Tap + to create one.</p>
        ) : (
          <div className={styles.exerciseList}>
            {bodyAreas.map((ba) => (
              <div key={ba.id} className={styles.exerciseRow}>
                {editingArea === ba.id ? (
                  <div className={styles.inlineEdit}>
                    <input
                      type="text"
                      value={editAreaName}
                      onChange={(e) => setEditAreaName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveArea();
                        if (e.key === "Escape") cancelEditArea();
                      }}
                      autoFocus
                    />
                    <div className={styles.rowActions}>
                      <button
                        className="btn-primary"
                        onClick={handleSaveArea}
                        disabled={busy || !editAreaName.trim()}
                      >
                        Save
                      </button>
                      <button className="btn-abort" onClick={cancelEditArea} disabled={busy}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className={styles.exerciseName} style={{ color: areaColorVar(ba.name) }}>{ba.name}</span>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.iconBtn}
                        onClick={() => startEditArea(ba)}
                        disabled={busy}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => handleDeleteArea(ba.id)}
                        disabled={busy}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {editingArea === "new" && (
          <div className={styles.inlineEdit}>
            <input
              type="text"
              value={editAreaName}
              onChange={(e) => setEditAreaName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveArea();
                if (e.key === "Escape") cancelEditArea();
              }}
              placeholder="Body area name"
              autoFocus
            />
            <div className={styles.rowActions}>
              <button
                className="btn-primary"
                onClick={handleSaveArea}
                disabled={busy || !editAreaName.trim()}
              >
                Save
              </button>
              <button className="btn-abort" onClick={cancelEditArea} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
