import { useEffect, useState } from "react";
import {
  fetchPlans,
  fetchBodyAreas,
  createPlan,
  updatePlan,
  deletePlan,
  setActivePlan,
} from "../api";
import { useUser } from "../UserContext";
import type { BodyArea, PlanWithFocusAreas, PtsType, CreatePlanBody } from "../types";
import { colorIndexToVar, PALETTE_SIZE } from "../areaColor";
import styles from "./Plans.module.css";

interface FocusAreaRow {
  bodyAreaId: number;
  ptsPerPeriod: number;
  ptsType: PtsType;
  periodLengthDays: number;
  colorIndex: number;
}

function emptyRow(count: number): FocusAreaRow {
  return { bodyAreaId: 0, ptsPerPeriod: 3, ptsType: "effort", periodLengthDays: 7, colorIndex: count % PALETTE_SIZE };
}

export default function Plans() {
  const { user, setUser } = useUser();
  const [plans, setPlans] = useState<PlanWithFocusAreas[]>([]);
  const [bodyAreas, setBodyAreas] = useState<BodyArea[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [editName, setEditName] = useState("");
  const [editRows, setEditRows] = useState<FocusAreaRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchPlans(user.id).then(setPlans).catch(() => setError("Failed to load plans"));
    fetchBodyAreas().then(setBodyAreas).catch(() => {});
  }, [user]);

  const startEdit = (plan: PlanWithFocusAreas) => {
    setEditing(plan.id);
    setEditName(plan.name);
    setEditRows(
      plan.focusAreas.map((fa) => ({
        bodyAreaId: fa.body_area_id,
        ptsPerPeriod: fa.pts_per_period,
        ptsType: fa.pts_type,
        periodLengthDays: fa.period_length_days,
        colorIndex: fa.color_index,
      }))
    );
  };

  const startNew = () => {
    setEditing("new");
    setEditName("");
    setEditRows([emptyRow(0)]);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditName("");
    setEditRows([]);
  };

  const handleSave = async () => {
    if (!user || !editName.trim()) return;
    const validRows = editRows.filter((r) => r.bodyAreaId > 0);
    if (validRows.length === 0) return;

    const body: CreatePlanBody = {
      name: editName.trim(),
      focusAreas: validRows,
    };

    setBusy(true);
    setError("");
    try {
      if (editing === "new") {
        await createPlan(user.id, body);
      } else if (typeof editing === "number") {
        await updatePlan(editing, body);
      }
      const updated = await fetchPlans(user.id);
      setPlans(updated);
      cancelEdit();
    } catch {
      setError("Failed to save plan");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (planId: number) => {
    if (!user) return;
    if (!confirm("Delete this plan?")) return;
    setBusy(true);
    try {
      await deletePlan(planId);
      const updated = await fetchPlans(user.id);
      setPlans(updated);
      if (user.active_plan_id === planId) {
        setUser({ ...user, active_plan_id: null });
      }
    } catch {
      setError("Failed to delete plan");
    } finally {
      setBusy(false);
    }
  };

  const handleSetActive = async (planId: number) => {
    if (!user) return;
    setBusy(true);
    try {
      const updatedUser = await setActivePlan(user.id, planId);
      setUser(updatedUser);
    } catch {
      setError("Failed to set active plan");
    } finally {
      setBusy(false);
    }
  };

  const updateRow = (index: number, updates: Partial<FocusAreaRow>) => {
    setEditRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...updates } : r))
    );
  };

  const removeRow = (index: number) => {
    setEditRows((prev) => prev.filter((_, i) => i !== index));
  };

  if (error) return <div className="error">{error}</div>;

  // Editing view
  if (editing !== null) {
    return (
      <div className="card">
        <h2>{editing === "new" ? "New Plan" : "Edit Plan"}</h2>
        <div className={styles.planEditor}>
          <div className={styles.planNameRow}>
            <label>Plan Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. General Fitness"
            />
          </div>

          <h3>Focus Areas</h3>
          {editRows.map((row, i) => (
            <div key={i} className={styles.focusAreaEditorRow}>
              <select
                value={row.bodyAreaId}
                onChange={(e) =>
                  updateRow(i, { bodyAreaId: parseInt(e.target.value, 10) })
                }
              >
                <option value={0}>Select body area...</option>
                {bodyAreas.map((ba) => (
                  <option key={ba.id} value={ba.id}>
                    {ba.name}
                  </option>
                ))}
              </select>
              <div className={styles.editorField}>
                <label>Points</label>
                <input
                  type="number"
                  min="1"
                  value={row.ptsPerPeriod}
                  onChange={(e) =>
                    updateRow(i, {
                      ptsPerPeriod: parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>
              <div className={styles.editorField}>
                <label>Type</label>
                <select
                  value={row.ptsType}
                  onChange={(e) =>
                    updateRow(i, { ptsType: e.target.value as PtsType })
                  }
                >
                  <option value="effort">Effort</option>
                  <option value="active_minutes">Active Min</option>
                </select>
              </div>
              <div className={styles.editorField}>
                <label>Every (days)</label>
                <input
                  type="number"
                  min="1"
                  value={row.periodLengthDays}
                  onChange={(e) =>
                    updateRow(i, {
                      periodLengthDays: parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>
              <button
                className={styles.btnRemoveRow}
                onClick={() => removeRow(i)}
                title="Remove"
              >
                x
              </button>
              <div className={styles.colorSwatches}>
                {Array.from({ length: PALETTE_SIZE }, (_, ci) => (
                  <button
                    key={ci}
                    type="button"
                    className={`${styles.colorSwatch}${row.colorIndex === ci ? ` ${styles.colorSwatchActive}` : ""}`}
                    style={{ background: colorIndexToVar(ci) }}
                    onClick={() => updateRow(i, { colorIndex: ci })}
                    title={`Color ${ci + 1}`}
                  />
                ))}
              </div>
            </div>
          ))}

          <button
            className={styles.btnAddRow}
            onClick={() => setEditRows((prev) => [...prev, emptyRow(prev.length)])}
          >
            + Add Focus Area
          </button>

          <div className={styles.planEditorActions}>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={busy || !editName.trim()}
            >
              {busy ? "Saving..." : "Save Plan"}
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
    <div className="card">
      <h2>Workout Plans</h2>
      {plans.length === 0 ? (
        <p className="muted">No plans yet. Create one to get started.</p>
      ) : (
        <div className={styles.planList}>
          {plans.map((plan) => {
            const isActive = user?.active_plan_id === plan.id;
            return (
              <div
                key={plan.id}
                className={`${styles.planCard}${isActive ? ` ${styles.activePlan}` : ""}`}
              >
                <div className={styles.planCardHeader}>
                  <span className={styles.planName}>{plan.name}</span>
                  {isActive && <span className="active-badge">ACTIVE</span>}
                </div>
                <div className={styles.planFocusAreas}>
                  {plan.focusAreas.map((fa) => (
                    <span
                      key={fa.id}
                      className={styles.planFocusTag}
                      style={{ borderLeftColor: colorIndexToVar(fa.color_index) }}
                    >
                      {fa.body_area_name}: {fa.pts_per_period}
                      {fa.pts_type === "active_minutes" ? "min" : "pts"} /{" "}
                      {fa.period_length_days}d
                    </span>
                  ))}
                </div>
                <div className={styles.planCardActions}>
                  {!isActive && (
                    <button
                      className="btn-small"
                      onClick={() => handleSetActive(plan.id)}
                      disabled={busy}
                    >
                      Set Active
                    </button>
                  )}
                  <button
                    className="btn-small"
                    onClick={() => startEdit(plan)}
                    disabled={busy}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-small btn-danger"
                    onClick={() => handleDelete(plan.id)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button className="btn-primary" onClick={startNew}>
        Create Plan
      </button>
    </div>
  );
}
