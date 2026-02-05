import { Router, Request, Response } from "express";
import pool from "../db";
import type { DbWorkout, SetWithDetails, WorkoutWithSets } from "../types";

const router = Router();

// POST /api/users/:userId/workouts/start - Start a new workout
router.post("/api/users/:userId/workouts/start", async (req: Request, res: Response) => {
  const userId = parseInt(String(req.params.userId), 10);
  const { workoutDate } = req.body as { workoutDate?: string };

  try {
    // Check for existing active workout
    const existing = await pool.query(
      "SELECT id FROM workouts WHERE user_id = $1 AND finished = false",
      [userId]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "An active workout already exists" });
      return;
    }

    const result = await pool.query<DbWorkout>(
      "INSERT INTO workouts (user_id, workout_date) VALUES ($1, $2) RETURNING *",
      [userId, workoutDate || (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error starting workout:", err);
    res.status(500).json({ error: "Failed to start workout" });
  }
});

// POST /api/workouts/:id/finish - Finish a workout
router.post("/api/workouts/:id/finish", async (req: Request, res: Response) => {
  const workoutId = parseInt(String(req.params.id), 10);

  try {
    const result = await pool.query<DbWorkout>(
      `UPDATE workouts SET finished = true, completed_at = NOW()
       WHERE id = $1 AND finished = false
       RETURNING *`,
      [workoutId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Active workout not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error finishing workout:", err);
    res.status(500).json({ error: "Failed to finish workout" });
  }
});

// POST /api/workouts/:id/abort - Abort and delete a workout
router.post("/api/workouts/:id/abort", async (req: Request, res: Response) => {
  const workoutId = parseInt(String(req.params.id), 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Sets are CASCADE deleted with the workout
    const result = await client.query(
      "DELETE FROM workouts WHERE id = $1 AND finished = false RETURNING id",
      [workoutId]
    );
    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Active workout not found" });
      return;
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error aborting workout:", err);
    res.status(500).json({ error: "Failed to abort workout" });
  } finally {
    client.release();
  }
});

// GET /api/users/:userId/workouts/active - Get active workout with sets
router.get("/api/users/:userId/workouts/active", async (req: Request, res: Response) => {
  const userId = parseInt(String(req.params.userId), 10);

  try {
    const workoutResult = await pool.query<DbWorkout>(
      "SELECT * FROM workouts WHERE user_id = $1 AND finished = false ORDER BY started_at DESC LIMIT 1",
      [userId]
    );
    if (workoutResult.rows.length === 0) {
      res.json(null);
      return;
    }

    const workout = workoutResult.rows[0];
    const setsResult = await pool.query<SetWithDetails>(
      `SELECT s.*, e.name as exercise_name, ba.name as body_area_name
       FROM sets s
       JOIN exercises e ON e.id = s.exercise_id
       JOIN body_areas ba ON ba.id = e.body_area_id
       WHERE s.workout_id = $1
       ORDER BY s.id`,
      [workout.id]
    );

    res.json({ workout, sets: setsResult.rows });
  } catch (err) {
    console.error("Error fetching active workout:", err);
    res.status(500).json({ error: "Failed to fetch active workout" });
  }
});

// PUT /api/workouts/:id - Update workout date (finished workouts only)
router.put("/api/workouts/:id", async (req: Request, res: Response) => {
  const workoutId = parseInt(String(req.params.id), 10);
  const { workoutDate } = req.body as { workoutDate?: string };

  if (!workoutDate) {
    res.status(400).json({ error: "workoutDate is required" });
    return;
  }

  try {
    const result = await pool.query<DbWorkout>(
      `UPDATE workouts SET workout_date = $1
       WHERE id = $2 AND finished = true
       RETURNING *`,
      [workoutDate, workoutId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Finished workout not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating workout:", err);
    res.status(500).json({ error: "Failed to update workout" });
  }
});

// DELETE /api/workouts/:id - Delete a finished workout
router.delete("/api/workouts/:id", async (req: Request, res: Response) => {
  const workoutId = parseInt(String(req.params.id), 10);

  try {
    const result = await pool.query(
      "DELETE FROM workouts WHERE id = $1 AND finished = true RETURNING id",
      [workoutId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Finished workout not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting workout:", err);
    res.status(500).json({ error: "Failed to delete workout" });
  }
});

// GET /api/users/:userId/history - Recent finished workouts with sets
router.get("/api/users/:userId/history", async (req: Request, res: Response) => {
  const userId = parseInt(String(req.params.userId), 10);

  try {
    const workoutsResult = await pool.query<DbWorkout>(
      `SELECT * FROM workouts
       WHERE user_id = $1 AND finished = true
       ORDER BY workout_date DESC
       LIMIT 30`,
      [userId]
    );

    const workouts: WorkoutWithSets[] = [];
    for (const workout of workoutsResult.rows) {
      const setsResult = await pool.query<SetWithDetails>(
        `SELECT s.*, e.name as exercise_name, ba.name as body_area_name
         FROM sets s
         JOIN exercises e ON e.id = s.exercise_id
         JOIN body_areas ba ON ba.id = e.body_area_id
         WHERE s.workout_id = $1
         ORDER BY s.id`,
        [workout.id]
      );
      workouts.push({ ...workout, sets: setsResult.rows });
    }

    res.json(workouts);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
