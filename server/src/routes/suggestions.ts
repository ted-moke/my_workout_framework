import { Router, Request, Response } from "express";
import pool from "../db";
import { getSuggestions } from "../suggestions";
import type { DbUser, DbWorkout, SuggestionsResponse, SetWithDetails, FocusAreaSuggestion } from "../types";

const router = Router();

// GET /api/users/:userId/suggestions - Get sorted focus area suggestions
router.get("/api/users/:userId/suggestions", async (req: Request, res: Response) => {
  const userId = parseInt(String(req.params.userId), 10);

  try {
    // Get user and active plan
    const userResult = await pool.query<DbUser>(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = userResult.rows[0];

    // Check for active workout
    const activeResult = await pool.query<DbWorkout>(
      "SELECT * FROM workouts WHERE user_id = $1 AND finished = false ORDER BY started_at DESC LIMIT 1",
      [userId]
    );
    let activeWorkout: SuggestionsResponse["activeWorkout"] = null;
    if (activeResult.rows.length > 0) {
      const workout = activeResult.rows[0];
      const setsResult = await pool.query<SetWithDetails>(
        `SELECT s.*, e.name as exercise_name, ba.name as body_area_name
         FROM sets s
         JOIN exercises e ON e.id = s.exercise_id
         JOIN body_areas ba ON ba.id = e.body_area_id
         WHERE s.workout_id = $1
         ORDER BY s.id`,
        [workout.id]
      );
      activeWorkout = { workout, sets: setsResult.rows };
    }

    // Get suggestions if user has an active plan
    let suggestions: FocusAreaSuggestion[] = [];
    if (user.active_plan_id) {
      suggestions = await getSuggestions(pool, userId, user.active_plan_id);
    }

    const response: SuggestionsResponse = { suggestions, activeWorkout };
    res.json(response);
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

export default router;
