import "dotenv/config";
import pool from "./db";

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Drop existing tables (reverse dependency order)
    await client.query(`
      DROP TABLE IF EXISTS sets CASCADE;
      DROP TABLE IF EXISTS workouts CASCADE;
      DROP TABLE IF EXISTS focus_areas CASCADE;
      DROP TABLE IF EXISTS workout_plans CASCADE;
      DROP TABLE IF EXISTS exercises CASCADE;
      DROP TABLE IF EXISTS body_areas CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS workout_exercises CASCADE;
      DROP TABLE IF EXISTS workout_logs CASCADE;
      DROP TABLE IF EXISTS day_focus_areas CASCADE;
      DROP TABLE IF EXISTS days CASCADE;
      DROP TABLE IF EXISTS settings CASCADE;
    `);

    // Create tables
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        active_plan_id INT
      );

      CREATE TABLE body_areas (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE exercises (
        id SERIAL PRIMARY KEY,
        body_area_id INT NOT NULL REFERENCES body_areas(id),
        name TEXT NOT NULL
      );

      CREATE TABLE workout_plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        user_id INT NOT NULL REFERENCES users(id)
      );

      ALTER TABLE users
        ADD CONSTRAINT fk_active_plan
        FOREIGN KEY (active_plan_id) REFERENCES workout_plans(id);

      CREATE TABLE focus_areas (
        id SERIAL PRIMARY KEY,
        plan_id INT NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
        body_area_id INT NOT NULL REFERENCES body_areas(id),
        pts_per_period INT NOT NULL,
        pts_type TEXT NOT NULL CHECK (pts_type IN ('effort', 'active_minutes')),
        period_length_days INT NOT NULL
      );

      CREATE TABLE workouts (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id),
        workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        finished BOOLEAN NOT NULL DEFAULT FALSE
      );

      CREATE TABLE sets (
        id SERIAL PRIMARY KEY,
        workout_id INT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        exercise_id INT NOT NULL REFERENCES exercises(id),
        pts INT NOT NULL
      );
    `);

    // Seed body areas
    const bodyAreaRows = await client.query(`
      INSERT INTO body_areas (name) VALUES
        ('Lower Body'),
        ('Trunk Strength'),
        ('Cardio'),
        ('Mobility'),
        ('Back'),
        ('Shoulder'),
        ('Trunk Control'),
        ('Chest'),
        ('Arms'),
        ('Core Endurance')
      RETURNING id, name
    `);
    const bodyAreaMap = new Map<string, number>(
      bodyAreaRows.rows.map((r: { name: string; id: number }) => [r.name, r.id])
    );

    // Seed exercises
    const exercisesByArea: Record<string, string[]> = {
      "Lower Body": [
        "Split Squat",
        "Single Leg Romanian Deadlift",
        "Step Ups",
        "Jumps",
      ],
      "Trunk Strength": [
        "Med Ball Throw",
        "Scoop Toss",
        "Cable Chops/Lifts",
        "Shotput Throw",
      ],
      Cardio: ["Jog", "Nordic 4x4s", "Stairmaster", "Rucking Incline"],
      Mobility: ["Thoracic Rotation", "CARs", "Ankle Dorsiflexion"],
      Back: ["Chest Supported Row", "Lat Pulldown", "Face Pulls"],
      Shoulder: ["Landmine Press"],
      "Trunk Control": ["Pallof Press", "Dead Bugs"],
      Chest: ["Bench Press", "Incline Dumbbell Press", "Cable Fly", "Push-ups"],
      Arms: [
        "Barbell Curl",
        "Tricep Pushdown",
        "Hammer Curl",
        "Overhead Tricep Extension",
      ],
      "Core Endurance": ["Plank Hold", "Farmer's Carry", "Suitcase Carry"],
    };

    const exerciseMap = new Map<string, number>();
    for (const [areaName, exercises] of Object.entries(exercisesByArea)) {
      const areaId = bodyAreaMap.get(areaName)!;
      for (const name of exercises) {
        const result = await client.query(
          `INSERT INTO exercises (body_area_id, name) VALUES ($1, $2) RETURNING id`,
          [areaId, name]
        );
        exerciseMap.set(name, result.rows[0].id);
      }
    }

    // Seed user
    const userResult = await client.query(
      `INSERT INTO users (name) VALUES ('PJ') RETURNING id`
    );
    const userId = userResult.rows[0].id;

    // Seed workout plan: General Fitness
    const planResult = await client.query(
      `INSERT INTO workout_plans (name, user_id) VALUES ('General Fitness', $1) RETURNING id`,
      [userId]
    );
    const planId = planResult.rows[0].id;

    // Set active plan
    await client.query(`UPDATE users SET active_plan_id = $1 WHERE id = $2`, [
      planId,
      userId,
    ]);

    // Seed focus areas for General Fitness
    const focusAreas: {
      area: string;
      pts: number;
      type: string;
      days: number;
    }[] = [
      { area: "Lower Body", pts: 3, type: "effort", days: 7 },
      { area: "Trunk Strength", pts: 3, type: "effort", days: 7 },
      { area: "Cardio", pts: 75, type: "active_minutes", days: 4 },
      { area: "Mobility", pts: 2, type: "effort", days: 4 },
      { area: "Back", pts: 3, type: "effort", days: 7 },
      { area: "Shoulder", pts: 2, type: "effort", days: 7 },
      { area: "Trunk Control", pts: 2, type: "effort", days: 7 },
      { area: "Chest", pts: 3, type: "effort", days: 7 },
      { area: "Arms", pts: 2, type: "effort", days: 7 },
      { area: "Core Endurance", pts: 2, type: "effort", days: 7 },
    ];

    for (const fa of focusAreas) {
      await client.query(
        `INSERT INTO focus_areas (plan_id, body_area_id, pts_per_period, pts_type, period_length_days)
         VALUES ($1, $2, $3, $4, $5)`,
        [planId, bodyAreaMap.get(fa.area)!, fa.pts, fa.type, fa.days]
      );
    }

    // Seed a second plan: Upper Focus
    const plan2Result = await client.query(
      `INSERT INTO workout_plans (name, user_id) VALUES ('Upper Focus', $1) RETURNING id`,
      [userId]
    );
    const plan2Id = plan2Result.rows[0].id;

    const upperFocusAreas: {
      area: string;
      pts: number;
      type: string;
      days: number;
    }[] = [
      { area: "Back", pts: 4, type: "effort", days: 5 },
      { area: "Shoulder", pts: 3, type: "effort", days: 5 },
      { area: "Chest", pts: 4, type: "effort", days: 5 },
      { area: "Arms", pts: 3, type: "effort", days: 5 },
      { area: "Cardio", pts: 60, type: "active_minutes", days: 7 },
      { area: "Mobility", pts: 2, type: "effort", days: 7 },
    ];

    for (const fa of upperFocusAreas) {
      await client.query(
        `INSERT INTO focus_areas (plan_id, body_area_id, pts_per_period, pts_type, period_length_days)
         VALUES ($1, $2, $3, $4, $5)`,
        [plan2Id, bodyAreaMap.get(fa.area)!, fa.pts, fa.type, fa.days]
      );
    }

    // Seed historical workouts with sets for the suggestion algorithm
    // Workout 1: 2 days ago - Back and Shoulder
    const w1 = await client.query(
      `INSERT INTO workouts (user_id, workout_date, started_at, completed_at, finished)
       VALUES ($1, CURRENT_DATE - 2, NOW() - interval '2 days', NOW() - interval '2 days' + interval '45 minutes', true)
       RETURNING id`,
      [userId]
    );
    await client.query(
      `INSERT INTO sets (workout_id, exercise_id, pts) VALUES
        ($1, $2, 2), ($1, $3, 2), ($1, $4, 1)`,
      [
        w1.rows[0].id,
        exerciseMap.get("Chest Supported Row"),
        exerciseMap.get("Lat Pulldown"),
        exerciseMap.get("Landmine Press"),
      ]
    );

    // Workout 2: 5 days ago - Cardio and Mobility
    const w2 = await client.query(
      `INSERT INTO workouts (user_id, workout_date, started_at, completed_at, finished)
       VALUES ($1, CURRENT_DATE - 5, NOW() - interval '5 days', NOW() - interval '5 days' + interval '60 minutes', true)
       RETURNING id`,
      [userId]
    );
    await client.query(
      `INSERT INTO sets (workout_id, exercise_id, pts) VALUES
        ($1, $2, 30), ($1, $3, 20), ($1, $4, 1)`,
      [
        w2.rows[0].id,
        exerciseMap.get("Jog"),
        exerciseMap.get("Stairmaster"),
        exerciseMap.get("Thoracic Rotation"),
      ]
    );

    // Workout 3: 8 days ago - Chest, Arms, Lower Body
    const w3 = await client.query(
      `INSERT INTO workouts (user_id, workout_date, started_at, completed_at, finished)
       VALUES ($1, CURRENT_DATE - 8, NOW() - interval '8 days', NOW() - interval '8 days' + interval '50 minutes', true)
       RETURNING id`,
      [userId]
    );
    await client.query(
      `INSERT INTO sets (workout_id, exercise_id, pts) VALUES
        ($1, $2, 2), ($1, $3, 2), ($1, $4, 2), ($1, $5, 1)`,
      [
        w3.rows[0].id,
        exerciseMap.get("Bench Press"),
        exerciseMap.get("Barbell Curl"),
        exerciseMap.get("Split Squat"),
        exerciseMap.get("Tricep Pushdown"),
      ]
    );

    await client.query("COMMIT");
    console.log("Seed completed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
