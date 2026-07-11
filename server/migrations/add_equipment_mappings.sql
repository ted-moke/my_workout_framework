-- Map the exercises added since the original seed to their equipment.
-- Best-effort by name; anything left unmapped is treated as bodyweight.

INSERT INTO equipment (name) VALUES
  ('Pec Deck'),
  ('Leg Curl Machine'),
  ('Belt Squat Machine'),
  ('Sled'),
  ('Ab Wheel'),
  ('Slam Ball')
ON CONFLICT (name) DO NOTHING;

INSERT INTO exercise_equipment (exercise_id, equipment_id)
SELECT e.id, eq.id
FROM exercises e
JOIN (VALUES
  ('Preacher Curl', 'Barbell'),
  ('Preacher Curl', 'Bench'),
  ('Cable Row', 'Cable Machine'),
  ('Lat Pressdown', 'Cable Machine'),
  ('Rear Delt Fly', 'Dumbbells'),
  ('Shrugs', 'Dumbbells'),
  ('Chest fly db', 'Dumbbells'),
  ('Chest fly db', 'Bench'),
  ('Med ball chest pass', 'Medicine Ball'),
  ('Pec Deck', 'Pec Deck'),
  ('Kettlebell Swing', 'Kettlebell'),
  ('Romanian Deadlift', 'Barbell'),
  ('Leg Curl', 'Leg Curl Machine'),
  ('Hip Abductions', 'Resistance Band'),
  ('Hip Adductions', 'Resistance Band'),
  ('Belt squat', 'Belt Squat Machine'),
  ('Goblet Squats', 'Kettlebell'),
  ('Sled Press', 'Sled'),
  ('Sled Push', 'Sled'),
  ('Lateral raises', 'Dumbbells'),
  ('Lu Raises', 'Dumbbells'),
  ('Rotator Cuff', 'Resistance Band'),
  ('Shoulder Press Db', 'Dumbbells'),
  ('Ab Wheel', 'Ab Wheel'),
  ('Half Kneeling Dumbbell Lift', 'Dumbbells'),
  ('Landmine Rotation', 'Landmine'),
  ('Landmine Rotation', 'Barbell'),
  ('Slam balls', 'Slam Ball'),
  ('Wrist Extension/Flexion', 'Dumbbells'),
  ('Wrist Pronation/Supination', 'Dumbbells')
) AS m(exercise_name, equipment_name) ON m.exercise_name = e.name
JOIN equipment eq ON eq.name = m.equipment_name
WHERE e.is_placeholder = false
ON CONFLICT DO NOTHING;
