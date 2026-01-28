import { Router, Request, Response } from "express";
import pool from "./db";

const router = Router();

// GET /api/status — next day, suggested exercises, active workout if any
router.get("/api/status", async (_req: Request, res: Response) => {
  try {
    // Check for an active (unfinished) workout first
    const activeWorkout = await pool.query(`
      SELECT wl.id, wl.started_at, d.day_number, d.id as day_id
      FROM workout_logs wl
      JOIN days d ON d.id = wl.day_id
      WHERE wl.finished = false
      ORDER BY wl.started_at DESC
      LIMIT 1
    `);

    // Get the most recent finished workout
    const lastFinished = await pool.query(`
      SELECT wl.id, wl.completed_at, d.day_number
      FROM workout_logs wl
      JOIN days d ON d.id = wl.day_id
      WHERE wl.finished = true
      ORDER BY wl.completed_at DESC
      LIMIT 1
    `);

    let nextDayNumber: number;
    if (activeWorkout.rows.length > 0) {
      nextDayNumber = activeWorkout.rows[0].day_number;
    } else if (lastFinished.rows.length === 0) {
      nextDayNumber = 1;
    } else {
      nextDayNumber = (lastFinished.rows[0].day_number % 5) + 1;
    }

    // Get the next day info with focus areas
    const nextDay = await pool.query(`
      SELECT d.id as day_id, d.day_number, d.optional,
        json_agg(
          json_build_object('id', fa.id, 'name', fa.name)
          ORDER BY dfa.sort_order
        ) as focus_areas
      FROM days d
      JOIN day_focus_areas dfa ON dfa.day_id = d.id
      JOIN focus_areas fa ON fa.id = dfa.focus_area_id
      WHERE d.day_number = $1
      GROUP BY d.id
    `, [nextDayNumber]);

    // Get exercises per focus area setting
    const settingsResult = await pool.query(
      `SELECT value FROM settings WHERE key = 'exercises_per_focus_area'`
    );
    const exercisesPerFocus = settingsResult.rows.length > 0
      ? settingsResult.rows[0].value
      : 2;

    // Get exercise IDs already toggled on in the active workout
    let activeExerciseIds: number[] = [];
    if (activeWorkout.rows.length > 0) {
      const activeExResult = await pool.query(
        `SELECT exercise_id FROM workout_exercises WHERE workout_log_id = $1`,
        [activeWorkout.rows[0].id]
      );
      activeExerciseIds = activeExResult.rows.map((r) => r.exercise_id);
    }

    // Get ALL exercises across every focus area, sorted by last-done (oldest first)
    const dayFocusIds = new Set(
      nextDay.rows[0].focus_areas.map((fa: { id: number }) => fa.id)
    );

    const allFocusAreas = await pool.query(
      `SELECT id, name FROM focus_areas ORDER BY name`
    );

    const allExerciseGroups = [];

    for (const fa of allFocusAreas.rows) {
      const exercises = await pool.query(`
        SELECT e.id, e.name, e.focus_area_id,
          MAX(wl.completed_at) as last_done
        FROM exercises e
        LEFT JOIN workout_exercises we ON we.exercise_id = e.id
        LEFT JOIN workout_logs wl ON wl.id = we.workout_log_id AND wl.finished = true
        WHERE e.focus_area_id = $1
        GROUP BY e.id
        ORDER BY last_done ASC NULLS FIRST
      `, [fa.id]);

      const isForToday = dayFocusIds.has(fa.id);

      allExerciseGroups.push({
        focusArea: { ...fa, isForToday },
        exercises: exercises.rows.map((ex, idx) => ({
          ...ex,
          suggested: isForToday && idx < exercisesPerFocus,
        })),
      });
    }

    // Sort: today's focus areas first, then the rest alphabetically
    allExerciseGroups.sort((a, b) => {
      if (a.focusArea.isForToday && !b.focusArea.isForToday) return -1;
      if (!a.focusArea.isForToday && b.focusArea.isForToday) return 1;
      return a.focusArea.name.localeCompare(b.focusArea.name);
    });

    res.json({
      nextDay: nextDay.rows[0],
      allExerciseGroups,
      activeWorkout: activeWorkout.rows[0] || null,
      activeExerciseIds,
      lastWorkout: lastFinished.rows[0] || null,
    });
  } catch (err) {
    console.error("Error in /api/status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/workouts/start — begin a new workout
router.post("/api/workouts/start", async (req: Request, res: Response) => {
  const { dayId } = req.body;
  if (!dayId) {
    res.status(400).json({ error: "dayId is required" });
    return;
  }

  try {
    // Don't allow starting if one is already active
    const existing = await pool.query(
      `SELECT id FROM workout_logs WHERE finished = false LIMIT 1`
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "A workout is already in progress", workoutId: existing.rows[0].id });
      return;
    }

    const result = await pool.query(
      `INSERT INTO workout_logs (day_id) VALUES ($1) RETURNING id, started_at`,
      [dayId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error in POST /api/workouts/start:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/workouts/:id/toggle — add or remove an exercise from the active workout
router.post("/api/workouts/:id/toggle", async (req: Request, res: Response) => {
  const workoutId = Number(req.params.id);
  const { exerciseId } = req.body;

  if (!exerciseId) {
    res.status(400).json({ error: "exerciseId is required" });
    return;
  }

  try {
    // Check if already in the workout
    const existing = await pool.query(
      `SELECT id FROM workout_exercises WHERE workout_log_id = $1 AND exercise_id = $2`,
      [workoutId, exerciseId]
    );

    if (existing.rows.length > 0) {
      // Remove it
      await pool.query(
        `DELETE FROM workout_exercises WHERE workout_log_id = $1 AND exercise_id = $2`,
        [workoutId, exerciseId]
      );
      res.json({ toggled: false });
    } else {
      // Add it
      await pool.query(
        `INSERT INTO workout_exercises (workout_log_id, exercise_id) VALUES ($1, $2)`,
        [workoutId, exerciseId]
      );
      res.json({ toggled: true });
    }
  } catch (err) {
    console.error("Error in POST /api/workouts/:id/toggle:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/workouts/:id/finish — mark workout as complete
router.post("/api/workouts/:id/finish", async (req: Request, res: Response) => {
  const workoutId = Number(req.params.id);

  try {
    const result = await pool.query(
      `UPDATE workout_logs SET finished = true, completed_at = NOW()
       WHERE id = $1 AND finished = false
       RETURNING id, completed_at`,
      [workoutId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "No active workout found with that id" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error in POST /api/workouts/:id/finish:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/workouts/:id/abort — discard an in-progress workout
router.post("/api/workouts/:id/abort", async (req: Request, res: Response) => {
  const workoutId = Number(req.params.id);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM workout_exercises WHERE workout_log_id = $1`,
      [workoutId]
    );
    const result = await client.query(
      `DELETE FROM workout_logs WHERE id = $1 AND finished = false RETURNING id`,
      [workoutId]
    );
    await client.query("COMMIT");

    if (result.rows.length === 0) {
      res.status(404).json({ error: "No active workout found with that id" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in POST /api/workouts/:id/abort:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// GET /api/history — recent finished workout logs with exercises
router.get("/api/history", async (_req: Request, res: Response) => {
  try {
    const logs = await pool.query(`
      SELECT wl.id, wl.completed_at, d.day_number,
        json_agg(
          json_build_object('id', fa.id, 'name', fa.name)
          ORDER BY dfa.sort_order
        ) FILTER (WHERE fa.id IS NOT NULL) as focus_areas
      FROM workout_logs wl
      JOIN days d ON d.id = wl.day_id
      LEFT JOIN day_focus_areas dfa ON dfa.day_id = d.id
      LEFT JOIN focus_areas fa ON fa.id = dfa.focus_area_id
      WHERE wl.finished = true
      GROUP BY wl.id, wl.completed_at, d.day_number
      ORDER BY wl.completed_at DESC
      LIMIT 20
    `);

    const logsWithExercises = await Promise.all(
      logs.rows.map(async (log) => {
        const exercises = await pool.query(`
          SELECT e.id, e.name, fa.name as focus_area
          FROM workout_exercises we
          JOIN exercises e ON e.id = we.exercise_id
          JOIN focus_areas fa ON fa.id = e.focus_area_id
          WHERE we.workout_log_id = $1
        `, [log.id]);
        return { ...log, exercises: exercises.rows };
      })
    );

    for (const log of logsWithExercises) {
      if (log.focus_areas) {
        const seen = new Set<number>();
        log.focus_areas = log.focus_areas.filter((fa: { id: number }) => {
          if (seen.has(fa.id)) return false;
          seen.add(fa.id);
          return true;
        });
      }
    }

    res.json(logsWithExercises);
  } catch (err) {
    console.error("Error in /api/history:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/exercises — all exercises grouped by focus area
router.get("/api/exercises", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT fa.id as focus_area_id, fa.name as focus_area,
        json_agg(
          json_build_object(
            'id', e.id,
            'name', e.name,
            'last_done', (
              SELECT MAX(wl.completed_at)
              FROM workout_exercises we
              JOIN workout_logs wl ON wl.id = we.workout_log_id AND wl.finished = true
              WHERE we.exercise_id = e.id
            )
          )
        ) as exercises
      FROM focus_areas fa
      JOIN exercises e ON e.focus_area_id = fa.id
      GROUP BY fa.id
      ORDER BY fa.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error in /api/exercises:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/settings
router.get("/api/settings", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT key, value FROM settings`);
    const settings: Record<string, unknown> = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (err) {
    console.error("Error in GET /api/settings:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/settings
router.put("/api/settings", async (req: Request, res: Response) => {
  const updates = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [key, value] of Object.entries(updates)) {
      await client.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2`,
        [key, JSON.stringify(value)]
      );
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in PUT /api/settings:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

export default router;
