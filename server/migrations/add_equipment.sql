-- Equipment dimension: what an exercise requires, and what the user owns at home.

CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- An exercise requires zero or more pieces of equipment.
-- Zero means bodyweight: always available, everywhere.
CREATE TABLE IF NOT EXISTS exercise_equipment (
  exercise_id INT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  equipment_id INT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  PRIMARY KEY (exercise_id, equipment_id)
);

-- Equipment the user owns at home. The gym is assumed to have everything.
CREATE TABLE IF NOT EXISTS user_equipment (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  equipment_id INT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, equipment_id)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS workout_location TEXT NOT NULL DEFAULT 'gym';

DO $$
BEGIN
  ALTER TABLE users ADD CONSTRAINT users_workout_location_check
    CHECK (workout_location IN ('home', 'gym'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

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
ON CONFLICT (name) DO NOTHING;

-- Map the existing seeded exercises to their equipment. Matched by name, so this
-- is a no-op for any exercise that has been renamed or added since the seed.
INSERT INTO exercise_equipment (exercise_id, equipment_id)
SELECT e.id, eq.id
FROM exercises e
JOIN (VALUES
  ('Single Leg Romanian Deadlift', 'Dumbbells'),
  ('Step Ups', 'Box/Step'),
  ('Med Ball Throw', 'Medicine Ball'),
  ('Scoop Toss', 'Medicine Ball'),
  ('Shotput Throw', 'Medicine Ball'),
  ('Cable Chops/Lifts', 'Cable Machine'),
  ('Stairmaster', 'Stairmaster'),
  ('Rucking Incline', 'Treadmill'),
  ('Chest Supported Row', 'Bench'),
  ('Chest Supported Row', 'Dumbbells'),
  ('Lat Pulldown', 'Cable Machine'),
  ('Face Pulls', 'Cable Machine'),
  ('Landmine Press', 'Landmine'),
  ('Landmine Press', 'Barbell'),
  ('Pallof Press', 'Cable Machine'),
  ('Bench Press', 'Barbell'),
  ('Bench Press', 'Bench'),
  ('Incline Dumbbell Press', 'Dumbbells'),
  ('Incline Dumbbell Press', 'Bench'),
  ('Cable Fly', 'Cable Machine'),
  ('Barbell Curl', 'Barbell'),
  ('Tricep Pushdown', 'Cable Machine'),
  ('Hammer Curl', 'Dumbbells'),
  ('Overhead Tricep Extension', 'Dumbbells'),
  ('Farmer''s Carry', 'Dumbbells'),
  ('Suitcase Carry', 'Dumbbells'),
  ('Wrist flexion', 'Dumbbells'),
  ('Wrist Extension', 'Dumbbells'),
  ('Wrist Supination', 'Dumbbells'),
  ('Wrist Pronation', 'Dumbbells'),
  ('Grip holds', 'Dumbbells')
) AS m(exercise_name, equipment_name) ON m.exercise_name = e.name
JOIN equipment eq ON eq.name = m.equipment_name
WHERE e.is_placeholder = false
ON CONFLICT DO NOTHING;
