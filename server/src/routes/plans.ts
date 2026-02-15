import { Router, Request, Response } from "express";
import pool from "../db";
import type {
  DbBodyArea,
  DbExercise,
  PlanWithFocusAreas,
  CreatePlanBody,
  DbFocusArea,
} from "../types";

const router = Router();

// GET /api/body-areas - List all body areas
router.get("/api/body-areas", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<DbBodyArea>(
      "SELECT * FROM body_areas ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching body areas:", err);
    res.status(500).json({ error: "Failed to fetch body areas" });
  }
});

// POST /api/body-areas - Create a body area
router.post("/api/body-areas", async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ error: "Body area name is required" });
    return;
  }

  try {
    const result = await pool.query<DbBodyArea>(
      "INSERT INTO body_areas (name) VALUES ($1) RETURNING *",
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "A body area with that name already exists" });
      return;
    }
    console.error("Error creating body area:", err);
    res.status(500).json({ error: "Failed to create body area" });
  }
});

// PUT /api/body-areas/:id - Rename a body area
router.put("/api/body-areas/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  const { name } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ error: "Body area name is required" });
    return;
  }

  try {
    const result = await pool.query<DbBodyArea>(
      "UPDATE body_areas SET name = $1 WHERE id = $2 RETURNING *",
      [name.trim(), id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Body area not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "A body area with that name already exists" });
      return;
    }
    console.error("Error updating body area:", err);
    res.status(500).json({ error: "Failed to update body area" });
  }
});

// DELETE /api/body-areas/:id - Delete a body area (409 if referenced)
router.delete("/api/body-areas/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);

  try {
    const exerciseCheck = await pool.query(
      "SELECT COUNT(*) FROM exercises WHERE body_area_id = $1",
      [id]
    );
    if (parseInt(exerciseCheck.rows[0].count, 10) > 0) {
      res.status(409).json({
        error: "Cannot delete body area — it has exercises referencing it",
      });
      return;
    }

    const focusCheck = await pool.query(
      "SELECT COUNT(*) FROM focus_areas WHERE body_area_id = $1",
      [id]
    );
    if (parseInt(focusCheck.rows[0].count, 10) > 0) {
      res.status(409).json({
        error: "Cannot delete body area — it has focus areas referencing it",
      });
      return;
    }

    const result = await pool.query(
      "DELETE FROM body_areas WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Body area not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting body area:", err);
    res.status(500).json({ error: "Failed to delete body area" });
  }
});

// GET /api/exercises - List all exercises grouped by body area
router.get("/api/exercises", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<DbExercise & { body_area_name: string }>(
      `SELECT e.*, ba.name as body_area_name
       FROM exercises e
       JOIN body_areas ba ON ba.id = e.body_area_id
       ORDER BY ba.name, e.name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching exercises:", err);
    res.status(500).json({ error: "Failed to fetch exercises" });
  }
});

// GET /api/users/:userId/plans - List plans for a user with focus areas
router.get("/api/users/:userId/plans", async (req: Request, res: Response) => {
  const userId = parseInt(String(req.params.userId), 10);
  try {
    const plansResult = await pool.query(
      "SELECT * FROM workout_plans WHERE user_id = $1 ORDER BY id",
      [userId]
    );

    const plans: PlanWithFocusAreas[] = [];
    for (const plan of plansResult.rows) {
      const faResult = await pool.query<DbFocusArea & { body_area_name: string }>(
        `SELECT fa.*, ba.name as body_area_name
         FROM focus_areas fa
         JOIN body_areas ba ON ba.id = fa.body_area_id
         WHERE fa.plan_id = $1
         ORDER BY ba.name`,
        [plan.id]
      );
      plans.push({
        ...plan,
        focusAreas: faResult.rows,
      });
    }

    res.json(plans);
  } catch (err) {
    console.error("Error fetching plans:", err);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// POST /api/users/:userId/plans - Create a plan with focus areas
router.post("/api/users/:userId/plans", async (req: Request, res: Response) => {
  const userId = parseInt(String(req.params.userId), 10);
  const body = req.body as CreatePlanBody;

  if (!body.name?.trim()) {
    res.status(400).json({ error: "Plan name is required" });
    return;
  }
  if (!body.focusAreas || body.focusAreas.length === 0) {
    res.status(400).json({ error: "At least one focus area is required" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const planResult = await client.query(
      "INSERT INTO workout_plans (name, user_id) VALUES ($1, $2) RETURNING *",
      [body.name.trim(), userId]
    );
    const plan = planResult.rows[0];

    const focusAreas: (DbFocusArea & { body_area_name: string })[] = [];
    for (const fa of body.focusAreas) {
      const faResult = await client.query<DbFocusArea & { body_area_name: string }>(
        `INSERT INTO focus_areas (plan_id, body_area_id, pts_per_period, pts_type, period_length_days, color_index)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING focus_areas.*, (SELECT name FROM body_areas WHERE id = $2) as body_area_name`,
        [plan.id, fa.bodyAreaId, fa.ptsPerPeriod, fa.ptsType, fa.periodLengthDays, fa.colorIndex]
      );
      focusAreas.push(faResult.rows[0]);
    }

    await client.query("COMMIT");
    res.status(201).json({ ...plan, focusAreas });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating plan:", err);
    res.status(500).json({ error: "Failed to create plan" });
  } finally {
    client.release();
  }
});

// PUT /api/plans/:id - Update plan name and focus areas (full replace)
router.put("/api/plans/:id", async (req: Request, res: Response) => {
  const planId = parseInt(String(req.params.id), 10);
  const body = req.body as CreatePlanBody;

  if (!body.name?.trim()) {
    res.status(400).json({ error: "Plan name is required" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const planResult = await client.query(
      "UPDATE workout_plans SET name = $1 WHERE id = $2 RETURNING *",
      [body.name.trim(), planId]
    );
    if (planResult.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Plan not found" });
      return;
    }
    const plan = planResult.rows[0];

    // Delete existing focus areas and re-create
    await client.query("DELETE FROM focus_areas WHERE plan_id = $1", [planId]);

    const focusAreas: (DbFocusArea & { body_area_name: string })[] = [];
    for (const fa of body.focusAreas) {
      const faResult = await client.query<DbFocusArea & { body_area_name: string }>(
        `INSERT INTO focus_areas (plan_id, body_area_id, pts_per_period, pts_type, period_length_days, color_index)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING focus_areas.*, (SELECT name FROM body_areas WHERE id = $2) as body_area_name`,
        [planId, fa.bodyAreaId, fa.ptsPerPeriod, fa.ptsType, fa.periodLengthDays, fa.colorIndex]
      );
      focusAreas.push(faResult.rows[0]);
    }

    await client.query("COMMIT");
    res.json({ ...plan, focusAreas });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating plan:", err);
    res.status(500).json({ error: "Failed to update plan" });
  } finally {
    client.release();
  }
});

// DELETE /api/plans/:id - Delete a plan
router.delete("/api/plans/:id", async (req: Request, res: Response) => {
  const planId = parseInt(String(req.params.id), 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clear active_plan_id if this was the active plan
    await client.query(
      "UPDATE users SET active_plan_id = NULL WHERE active_plan_id = $1",
      [planId]
    );

    const result = await client.query(
      "DELETE FROM workout_plans WHERE id = $1 RETURNING id",
      [planId]
    );
    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting plan:", err);
    res.status(500).json({ error: "Failed to delete plan" });
  } finally {
    client.release();
  }
});

// POST /api/exercises - Create a new exercise
router.post("/api/exercises", async (req: Request, res: Response) => {
  const { name, bodyAreaId } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ error: "Exercise name is required" });
    return;
  }
  if (!bodyAreaId) {
    res.status(400).json({ error: "Body area is required" });
    return;
  }

  try {
    const result = await pool.query<DbExercise & { body_area_name: string }>(
      `INSERT INTO exercises (name, body_area_id) VALUES ($1, $2)
       RETURNING exercises.*, (SELECT name FROM body_areas WHERE id = $2) as body_area_name`,
      [name.trim(), bodyAreaId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating exercise:", err);
    res.status(500).json({ error: "Failed to create exercise" });
  }
});

// PUT /api/exercises/:id - Update an exercise
router.put("/api/exercises/:id", async (req: Request, res: Response) => {
  const exerciseId = parseInt(String(req.params.id), 10);
  const { name, bodyAreaId } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ error: "Exercise name is required" });
    return;
  }
  if (!bodyAreaId) {
    res.status(400).json({ error: "Body area is required" });
    return;
  }

  try {
    const result = await pool.query<DbExercise & { body_area_name: string }>(
      `UPDATE exercises SET name = $1, body_area_id = $2 WHERE id = $3
       RETURNING exercises.*, (SELECT name FROM body_areas WHERE id = $2) as body_area_name`,
      [name.trim(), bodyAreaId, exerciseId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Exercise not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating exercise:", err);
    res.status(500).json({ error: "Failed to update exercise" });
  }
});

// DELETE /api/exercises/:id - Delete an exercise (409 if referenced by sets)
router.delete("/api/exercises/:id", async (req: Request, res: Response) => {
  const exerciseId = parseInt(String(req.params.id), 10);

  try {
    const setsCheck = await pool.query(
      "SELECT COUNT(*) FROM sets WHERE exercise_id = $1",
      [exerciseId]
    );
    if (parseInt(setsCheck.rows[0].count, 10) > 0) {
      res.status(409).json({
        error: "Cannot delete exercise — it has sets referencing it",
      });
      return;
    }

    const result = await pool.query(
      "DELETE FROM exercises WHERE id = $1 RETURNING id",
      [exerciseId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Exercise not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting exercise:", err);
    res.status(500).json({ error: "Failed to delete exercise" });
  }
});

export default router;
