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
      DROP TABLE IF EXISTS exercise_equipment CASCADE;
      DROP TABLE IF EXISTS user_equipment CASCADE;
      DROP TABLE IF EXISTS equipment CASCADE;
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
        active_plan_id INT,
        workout_location TEXT NOT NULL DEFAULT 'gym'
          CHECK (workout_location IN ('home', 'gym'))
      );

      CREATE TABLE body_areas (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE exercises (
        id SERIAL PRIMARY KEY,
        body_area_id INT NOT NULL REFERENCES body_areas(id),
        name TEXT NOT NULL,
        is_placeholder BOOLEAN NOT NULL DEFAULT false
      );

      CREATE UNIQUE INDEX exercises_one_placeholder_per_area
        ON exercises (body_area_id) WHERE is_placeholder = true;

      CREATE TABLE equipment (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE exercise_equipment (
        exercise_id INT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        equipment_id INT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
        PRIMARY KEY (exercise_id, equipment_id)
      );

      CREATE TABLE user_equipment (
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        equipment_id INT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, equipment_id)
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
        period_length_days INT NOT NULL,
        color_index INT NOT NULL DEFAULT 0
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
        pts INT NOT NULL,
        weight NUMERIC(7, 2) CHECK (weight IS NULL OR weight >= 0),
        reps INT CHECK (reps IS NULL OR reps >= 0)
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
        ('Core Endurance'),
        ('Wrists'),
        ('Neck')
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
        "Glute Bridge",
        "Calf Raises"
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
      "Wrists": ["Wrist flexion", "Wrist Extension", "Wrist Supination", "Wrist Pronation", "Grip holds"],
      "Neck": ["Neck Flexion", "Neck Extension", "Neck Rotation", "Neck Lateral Flexion"]
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

    // Seed placeholder "General" exercise for each body area
    for (const areaId of bodyAreaMap.values()) {
      await client.query(
        `INSERT INTO exercises (body_area_id, name, is_placeholder) VALUES ($1, 'General', true)`,
        [areaId]
      );
    }

    // Seed equipment
    const equipmentRows = await client.query(`
      INSERT INTO equipment (name) VALUES
        ('Barbell'),
        ('Dumbbells'),
        ('Kettlebell'),
        ('Bench'),
        ('Squat Rack'),
        ('Cable Machine'),
        ('Pull-up Bar'),
        ('Resistance Band'),
        ('Medicine Ball'),
        ('Box/Step'),
        ('Landmine'),
        ('Treadmill'),
        ('Stairmaster'),
        ('Mat')
      RETURNING id, name
    `);
    const equipmentMap = new Map<string, number>(
      equipmentRows.rows.map((r: { name: string; id: number }) => [r.name, r.id])
    );

    // Map exercises to the equipment they require. Anything omitted is bodyweight
    // and is therefore available at home regardless of what the user owns.
    const equipmentByExercise: Record<string, string[]> = {
      "Single Leg Romanian Deadlift": ["Dumbbells"],
      "Step Ups": ["Box/Step"],
      "Med Ball Throw": ["Medicine Ball"],
      "Scoop Toss": ["Medicine Ball"],
      "Shotput Throw": ["Medicine Ball"],
      "Cable Chops/Lifts": ["Cable Machine"],
      Stairmaster: ["Stairmaster"],
      "Rucking Incline": ["Treadmill"],
      "Chest Supported Row": ["Bench", "Dumbbells"],
      "Lat Pulldown": ["Cable Machine"],
      "Face Pulls": ["Cable Machine"],
      "Landmine Press": ["Landmine", "Barbell"],
      "Pallof Press": ["Cable Machine"],
      "Bench Press": ["Barbell", "Bench"],
      "Incline Dumbbell Press": ["Dumbbells", "Bench"],
      "Cable Fly": ["Cable Machine"],
      "Barbell Curl": ["Barbell"],
      "Tricep Pushdown": ["Cable Machine"],
      "Hammer Curl": ["Dumbbells"],
      "Overhead Tricep Extension": ["Dumbbells"],
      "Farmer's Carry": ["Dumbbells"],
      "Suitcase Carry": ["Dumbbells"],
      "Wrist flexion": ["Dumbbells"],
      "Wrist Extension": ["Dumbbells"],
      "Wrist Supination": ["Dumbbells"],
      "Wrist Pronation": ["Dumbbells"],
      "Grip holds": ["Dumbbells"],
    };

    for (const [exerciseName, equipmentNames] of Object.entries(equipmentByExercise)) {
      for (const equipmentName of equipmentNames) {
        await client.query(
          `INSERT INTO exercise_equipment (exercise_id, equipment_id) VALUES ($1, $2)`,
          [exerciseMap.get(exerciseName)!, equipmentMap.get(equipmentName)!]
        );
      }
    }

    // Seed user
    const userResult = await client.query(
      `INSERT INTO users (name) VALUES ('PJ') RETURNING id`
    );
    const userId = userResult.rows[0].id;

    // Seed a modest home gym
    for (const name of ["Dumbbells", "Resistance Band", "Mat", "Pull-up Bar"]) {
      await client.query(
        `INSERT INTO user_equipment (user_id, equipment_id) VALUES ($1, $2)`,
        [userId, equipmentMap.get(name)!]
      );
    }

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
      { area: "Lower Body", pts: 6, type: "effort", days: 7 },
      { area: "Trunk Strength", pts: 4, type: "effort", days: 7 },
      { area: "Cardio", pts: 150, type: "active_minutes", days: 7 },
      { area: "Mobility", pts: 3, type: "effort", days: 7 },
      { area: "Back", pts: 6, type: "effort", days: 7 },
      { area: "Shoulder", pts: 4, type: "effort", days: 7 },
      { area: "Trunk Control", pts: 2, type: "effort", days: 7 },
      { area: "Chest", pts: 3, type: "effort", days: 7 },
      { area: "Arms", pts: 2, type: "effort", days: 7 },
      { area: "Core Endurance", pts: 2, type: "effort", days: 7 },
      { area: "Wrists", pts: 1, type: "effort", days: 7 },
      { area: "Neck", pts: 1, type: "effort", days: 7 },
    ];

    for (let i = 0; i < focusAreas.length; i++) {
      const fa = focusAreas[i];
      await client.query(
        `INSERT INTO focus_areas (plan_id, body_area_id, pts_per_period, pts_type, period_length_days, color_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [planId, bodyAreaMap.get(fa.area)!, fa.pts, fa.type, fa.days, i % 12]
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

    for (let i = 0; i < upperFocusAreas.length; i++) {
      const fa = upperFocusAreas[i];
      await client.query(
        `INSERT INTO focus_areas (plan_id, body_area_id, pts_per_period, pts_type, period_length_days, color_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [plan2Id, bodyAreaMap.get(fa.area)!, fa.pts, fa.type, fa.days, i % 12]
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
