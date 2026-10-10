import { Router, Request, Response } from "express";
import pool from "../db";
import { computeExerciseStats, type StatSetRow } from "../exerciseStats";

const router = Router();

// GET /api/users/:userId/exercise-stats - Max and last weight/reps per exercise.
// Only finished workouts count, so the workout in progress is excluded.
router.get("/api/users/:userId/exercise-stats", async (req: Request, res: Response) => {
  const userId = parseInt(String(req.params.userId), 10);

  try {
    const result = await pool.query<StatSetRow>(
      `SELECT s.id AS set_id, s.workout_id, s.exercise_id,
              to_char(w.workout_date, 'YYYY-MM-DD') AS workout_date,
              s.weight, s.reps
       FROM sets s
       JOIN workouts w ON w.id = s.workout_id
       WHERE w.user_id = $1 AND w.finished = true
         AND (s.weight IS NOT NULL OR s.reps IS NOT NULL)
       ORDER BY w.workout_date DESC, w.id DESC, s.id`,
      [userId]
    );
    res.json(Object.fromEntries(computeExerciseStats(result.rows)));
  } catch (err) {
    console.error("Error fetching exercise stats:", err);
    res.status(500).json({ error: "Failed to fetch exercise stats" });
  }
});

export default router;
