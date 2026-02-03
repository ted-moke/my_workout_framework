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

interface FocusAreaRow {
  bodyAreaId: number;
  ptsPerPeriod: number;
  ptsType: PtsType;
  periodLengthDays: number;
}

function emptyRow(): FocusAreaRow {
  return { bodyAreaId: 0, ptsPerPeriod: 3, ptsType: "effort", periodLengthDays: 7 };
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
      }))
    );
  };

  const startNew = () => {
    setEditing("new");
    setEditName("");
    setEditRows([emptyRow()]);
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
        <div className="plan-editor">
          <div className="plan-name-row">
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
            <div key={i} className="focus-area-editor-row">
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
              <div className="editor-field">
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
              <div className="editor-field">
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
              <div className="editor-field">
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
                className="btn-remove-row"
                onClick={() => removeRow(i)}
                title="Remove"
              >
                x
              </button>
            </div>
          ))}

          <button
            className="btn-add-row"
            onClick={() => setEditRows((prev) => [...prev, emptyRow()])}
          >
            + Add Focus Area
          </button>

          <div className="plan-editor-actions">
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
        <div className="plan-list">
          {plans.map((plan) => {
            const isActive = user?.active_plan_id === plan.id;
            return (
              <div
                key={plan.id}
                className={`plan-card${isActive ? " active-plan" : ""}`}
              >
                <div className="plan-card-header">
                  <span className="plan-name">{plan.name}</span>
                  {isActive && <span className="active-badge">ACTIVE</span>}
                </div>
                <div className="plan-focus-areas">
                  {plan.focusAreas.map((fa) => (
                    <span key={fa.id} className="plan-focus-tag">
                      {fa.body_area_name}: {fa.pts_per_period}
                      {fa.pts_type === "active_minutes" ? "min" : "pts"} /{" "}
                      {fa.period_length_days}d
                    </span>
                  ))}
                </div>
                <div className="plan-card-actions">
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
