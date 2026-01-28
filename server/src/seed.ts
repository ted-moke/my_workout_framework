import pool from "./db";

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Drop existing tables (reverse dependency order)
    await client.query(`
      DROP TABLE IF EXISTS workout_exercises CASCADE;
      DROP TABLE IF EXISTS workout_logs CASCADE;
      DROP TABLE IF EXISTS exercises CASCADE;
      DROP TABLE IF EXISTS day_focus_areas CASCADE;
      DROP TABLE IF EXISTS focus_areas CASCADE;
      DROP TABLE IF EXISTS days CASCADE;
      DROP TABLE IF EXISTS settings CASCADE;
    `);

    // Create tables
    await client.query(`
      CREATE TABLE days (
        id SERIAL PRIMARY KEY,
        day_number INT NOT NULL UNIQUE,
        optional BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE focus_areas (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE day_focus_areas (
        day_id INT REFERENCES days(id),
        focus_area_id INT REFERENCES focus_areas(id),
        sort_order INT DEFAULT 0,
        PRIMARY KEY (day_id, focus_area_id)
      );

      CREATE TABLE exercises (
        id SERIAL PRIMARY KEY,
        focus_area_id INT REFERENCES focus_areas(id),
        name TEXT NOT NULL
      );

      CREATE TABLE workout_logs (
        id SERIAL PRIMARY KEY,
        day_id INT REFERENCES days(id),
        started_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        finished BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE workout_exercises (
        id SERIAL PRIMARY KEY,
        workout_log_id INT REFERENCES workout_logs(id),
        exercise_id INT REFERENCES exercises(id)
      );

      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL
      );
    `);

    // Seed days (5-day rotation)
    const dayRows = await client.query(`
      INSERT INTO days (day_number, optional) VALUES
        (1, false),
        (2, false),
        (3, false),
        (4, false),
        (5, false)
      RETURNING id, day_number
    `);
    const dayMap = new Map(dayRows.rows.map((r) => [r.day_number, r.id]));

    // Seed focus areas
    const focusRows = await client.query(`
      INSERT INTO focus_areas (name) VALUES
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
    const focusMap = new Map(focusRows.rows.map((r) => [r.name, r.id]));

    // Day-to-focus-area mapping
    const dayFocusAreas: Record<number, string[]> = {
      1: ["Lower Body", "Trunk Strength"],
      2: ["Cardio", "Mobility"],
      3: ["Back", "Shoulder", "Trunk Control"],
      4: ["Cardio", "Mobility"],
      5: ["Chest", "Arms", "Core Endurance"],
    };

    for (const [dayNum, areas] of Object.entries(dayFocusAreas)) {
      for (let i = 0; i < areas.length; i++) {
        await client.query(
          `INSERT INTO day_focus_areas (day_id, focus_area_id, sort_order) VALUES ($1, $2, $3)`,
          [dayMap.get(Number(dayNum)), focusMap.get(areas[i]), i]
        );
      }
    }

    // Seed exercises per focus area
    const exercisesByFocus: Record<string, string[]> = {
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
      Cardio: [
        "Jog",
        "Nordic 4x4s",
        "Stairmaster",
        "Rucking Incline",
      ],
      Mobility: [
        "Thoracic Rotation",
        "CARs",
        "Ankle Dorsiflexion",
      ],
      Back: [
        "Chest Supported Row",
        "Lat Pulldown",
        "Face Pulls",
      ],
      Shoulder: [
        "Landmine Press",
      ],
      "Trunk Control": [
        "Pallof Press",
        "Dead Bugs",
      ],
      Chest: [
        "Bench Press",
        "Incline Dumbbell Press",
        "Cable Fly",
        "Push-ups",
      ],
      Arms: [
        "Barbell Curl",
        "Tricep Pushdown",
        "Hammer Curl",
        "Overhead Tricep Extension",
      ],
      "Core Endurance": [
        "Plank Hold",
        "Farmer's Carry",
        "Suitcase Carry",
      ],
    };

    for (const [focusName, exercises] of Object.entries(exercisesByFocus)) {
      const focusId = focusMap.get(focusName);
      for (const name of exercises) {
        await client.query(
          `INSERT INTO exercises (focus_area_id, name) VALUES ($1, $2)`,
          [focusId, name]
        );
      }
    }

    // Default settings
    await client.query(
      `INSERT INTO settings (key, value) VALUES ('exercises_per_focus_area', $1)`,
      [JSON.stringify(2)]
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
