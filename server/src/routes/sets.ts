import { Router, Request, Response } from "express";
import pool from "../db";
import type { DbSet } from "../types";
import { parseSetFields } from "../setFields";

const router = Router();

// POST /api/workouts/:workoutId/sets - Add a set
router.post("/api/workouts/:workoutId/sets", async (req: Request, res: Response) => {
  const workoutId = parseInt(String(req.params.workoutId), 10);
  const { exerciseId, pts } = req.body as { exerciseId?: number; pts?: number };

  if (!exerciseId || pts == null || pts < 0) {
    res.status(400).json({ error: "exerciseId and pts are required" });
    return;
  }

  const { fields, error } = parseSetFields(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  try {
    // Verify workout exists
    const workoutCheck = await pool.query(
      "SELECT id FROM workouts WHERE id = $1",
      [workoutId]
    );
    if (workoutCheck.rows.length === 0) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    const result = await pool.query<DbSet>(
      `INSERT INTO sets (workout_id, exercise_id, pts, weight, reps)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [workoutId, exerciseId, pts, fields.weight ?? null, fields.reps ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding set:", err);
    res.status(500).json({ error: "Failed to add set" });
  }
});

// PUT /api/sets/:id - Update pts, weight and/or reps on a set.
// Omitted fields are left unchanged; weight/reps may be null to clear them.
router.put("/api/sets/:id", async (req: Request, res: Response) => {
  const setId = parseInt(String(req.params.id), 10);
  const { pts } = req.body as { pts?: number };

  if (pts !== undefined && (pts == null || pts < 0)) {
    res.status(400).json({ error: "pts must be a non-negative number" });
    return;
  }

  const { fields, error } = parseSetFields(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const updates: [string, unknown][] = [];
  if (pts !== undefined) updates.push(["pts", pts]);
  if (fields.weight !== undefined) updates.push(["weight", fields.weight]);
  if (fields.reps !== undefined) updates.push(["reps", fields.reps]);

  if (updates.length === 0) {
    res.status(400).json({ error: "Nothing to update: send pts, weight or reps" });
    return;
  }

  try {
    const assignments = updates.map(([col], i) => `${col} = $${i + 1}`).join(", ");
    const result = await pool.query<DbSet>(
      `UPDATE sets SET ${assignments} WHERE id = $${updates.length + 1} RETURNING *`,
      [...updates.map(([, v]) => v), setId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Set not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating set:", err);
    res.status(500).json({ error: "Failed to update set" });
  }
});

// DELETE /api/sets/:id - Remove a set
router.delete("/api/sets/:id", async (req: Request, res: Response) => {
  const setId = parseInt(String(req.params.id), 10);

  try {
    const result = await pool.query(
      "DELETE FROM sets WHERE id = $1 RETURNING id",
      [setId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Set not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Error removing set:", err);
    res.status(500).json({ error: "Failed to remove set" });
  }
});

export default router;
