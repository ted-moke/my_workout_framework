import { Router, Request, Response } from "express";
import pool from "../db";
import type { DbEquipment } from "../types";

const router = Router();

// GET /api/equipment - List all equipment
router.get("/api/equipment", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<DbEquipment>(
      "SELECT * FROM equipment ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching equipment:", err);
    res.status(500).json({ error: "Failed to fetch equipment" });
  }
});

// POST /api/equipment - Create equipment
router.post("/api/equipment", async (req: Request, res: Response) => {
  const { name } = req.body as { name?: string };

  if (!name?.trim()) {
    res.status(400).json({ error: "Equipment name is required" });
    return;
  }

  try {
    const result = await pool.query<DbEquipment>(
      "INSERT INTO equipment (name) VALUES ($1) RETURNING *",
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Equipment with that name already exists" });
      return;
    }
    console.error("Error creating equipment:", err);
    res.status(500).json({ error: "Failed to create equipment" });
  }
});

// PUT /api/equipment/:id - Rename equipment
router.put("/api/equipment/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  const { name } = req.body as { name?: string };

  if (!name?.trim()) {
    res.status(400).json({ error: "Equipment name is required" });
    return;
  }

  try {
    const result = await pool.query<DbEquipment>(
      "UPDATE equipment SET name = $1 WHERE id = $2 RETURNING *",
      [name.trim(), id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Equipment not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Equipment with that name already exists" });
      return;
    }
    console.error("Error updating equipment:", err);
    res.status(500).json({ error: "Failed to update equipment" });
  }
});

// DELETE /api/equipment/:id - Delete equipment (409 if any exercise requires it)
router.delete("/api/equipment/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);

  try {
    const usageCheck = await pool.query(
      "SELECT COUNT(*) FROM exercise_equipment WHERE equipment_id = $1",
      [id]
    );
    if (parseInt(usageCheck.rows[0].count, 10) > 0) {
      res.status(409).json({
        error: "Cannot delete equipment — it has exercises requiring it",
      });
      return;
    }

    const result = await pool.query(
      "DELETE FROM equipment WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Equipment not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting equipment:", err);
    res.status(500).json({ error: "Failed to delete equipment" });
  }
});

// GET /api/users/:userId/equipment - Equipment the user owns at home
router.get("/api/users/:userId/equipment", async (req: Request, res: Response) => {
  const userId = parseInt(String(req.params.userId), 10);

  try {
    const result = await pool.query<DbEquipment>(
      `SELECT eq.*
       FROM user_equipment ue
       JOIN equipment eq ON eq.id = ue.equipment_id
       WHERE ue.user_id = $1
       ORDER BY eq.name`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching user equipment:", err);
    res.status(500).json({ error: "Failed to fetch user equipment" });
  }
});

// PUT /api/users/:userId/equipment - Replace the set of equipment owned at home
router.put("/api/users/:userId/equipment", async (req: Request, res: Response) => {
  const userId = parseInt(String(req.params.userId), 10);
  const { equipmentIds } = req.body as { equipmentIds?: number[] };

  if (!Array.isArray(equipmentIds)) {
    res.status(400).json({ error: "equipmentIds must be an array" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM user_equipment WHERE user_id = $1", [userId]);
    if (equipmentIds.length > 0) {
      await client.query(
        `INSERT INTO user_equipment (user_id, equipment_id)
         SELECT $1, UNNEST($2::int[])`,
        [userId, equipmentIds]
      );
    }
    await client.query("COMMIT");

    const result = await pool.query<DbEquipment>(
      `SELECT eq.*
       FROM user_equipment ue
       JOIN equipment eq ON eq.id = ue.equipment_id
       WHERE ue.user_id = $1
       ORDER BY eq.name`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating user equipment:", err);
    res.status(500).json({ error: "Failed to update user equipment" });
  } finally {
    client.release();
  }
});

export default router;
