-- Add is_placeholder column to exercises
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN NOT NULL DEFAULT false;

-- Ensure at most one placeholder per body area
CREATE UNIQUE INDEX IF NOT EXISTS exercises_one_placeholder_per_area
  ON exercises (body_area_id) WHERE is_placeholder = true;

-- Create "General" placeholder exercise for any body area that doesn't have one
INSERT INTO exercises (name, body_area_id, is_placeholder)
SELECT 'General', ba.id, true
FROM body_areas ba
WHERE NOT EXISTS (
  SELECT 1 FROM exercises e WHERE e.body_area_id = ba.id AND e.is_placeholder = true
);
