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
        `INSERT INTO focus_areas (plan_id, body_area_id, pts_per_period, pts_type, period_length_days)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING focus_areas.*, (SELECT name FROM body_areas WHERE id = $2) as body_area_name`,
        [plan.id, fa.bodyAreaId, fa.ptsPerPeriod, fa.ptsType, fa.periodLengthDays]
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
        `INSERT INTO focus_areas (plan_id, body_area_id, pts_per_period, pts_type, period_length_days)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING focus_areas.*, (SELECT name FROM body_areas WHERE id = $2) as body_area_name`,
        [planId, fa.bodyAreaId, fa.ptsPerPeriod, fa.ptsType, fa.periodLengthDays]
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

export default router;
