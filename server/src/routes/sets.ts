import { Router, Request, Response } from "express";
import pool from "../db";
import type { DbSet } from "../types";

const router = Router();

// POST /api/workouts/:workoutId/sets - Add a set
router.post("/api/workouts/:workoutId/sets", async (req: Request, res: Response) => {
  const workoutId = parseInt(String(req.params.workoutId), 10);
  const { exerciseId, pts } = req.body as { exerciseId?: number; pts?: number };

  if (!exerciseId || pts == null || pts < 0) {
    res.status(400).json({ error: "exerciseId and pts are required" });
    return;
  }

  try {
    // Verify workout is active
    const workoutCheck = await pool.query(
      "SELECT id FROM workouts WHERE id = $1 AND finished = false",
      [workoutId]
    );
    if (workoutCheck.rows.length === 0) {
      res.status(404).json({ error: "Active workout not found" });
      return;
    }

    const result = await pool.query<DbSet>(
      "INSERT INTO sets (workout_id, exercise_id, pts) VALUES ($1, $2, $3) RETURNING *",
      [workoutId, exerciseId, pts]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding set:", err);
    res.status(500).json({ error: "Failed to add set" });
  }
});

// PUT /api/sets/:id - Update pts on a set
router.put("/api/sets/:id", async (req: Request, res: Response) => {
  const setId = parseInt(String(req.params.id), 10);
  const { pts } = req.body as { pts?: number };

  if (pts == null || pts < 0) {
    res.status(400).json({ error: "pts is required" });
    return;
  }

  try {
    const result = await pool.query<DbSet>(
      "UPDATE sets SET pts = $1 WHERE id = $2 RETURNING *",
      [pts, setId]
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
