import { Router, Request, Response } from "express";
import pool from "../db";
import type { DbUser } from "../types";

const router = Router();

// GET /api/users - List all users
router.get("/api/users", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<DbUser>(
      "SELECT id, name, active_plan_id FROM users ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/users - Create a user
router.post("/api/users", async (req: Request, res: Response) => {
  const { name } = req.body as { name?: string };
  if (!name || !name.trim()) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  try {
    const result = await pool.query<DbUser>(
      "INSERT INTO users (name) VALUES ($1) RETURNING id, name, active_plan_id",
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PUT /api/users/:id/active-plan - Set the active plan
router.put("/api/users/:id/active-plan", async (req: Request, res: Response) => {
  const userId = parseInt(String(req.params.id), 10);
  const { planId } = req.body as { planId?: number | null };

  try {
    // Verify plan belongs to user if not null
    if (planId != null) {
      const planCheck = await pool.query(
        "SELECT id FROM workout_plans WHERE id = $1 AND user_id = $2",
        [planId, userId]
      );
      if (planCheck.rows.length === 0) {
        res.status(404).json({ error: "Plan not found" });
        return;
      }
    }

    const result = await pool.query<DbUser>(
      "UPDATE users SET active_plan_id = $1 WHERE id = $2 RETURNING id, name, active_plan_id",
      [planId ?? null, userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error setting active plan:", err);
    res.status(500).json({ error: "Failed to set active plan" });
  }
});

export default router;
