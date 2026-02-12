-- Add color_index column to focus_areas with sequential defaults per plan
ALTER TABLE focus_areas ADD COLUMN IF NOT EXISTS color_index INT NOT NULL DEFAULT 0;

UPDATE focus_areas SET color_index = sub.rn FROM (
  SELECT id, (ROW_NUMBER() OVER (PARTITION BY plan_id ORDER BY id) - 1) % 12 AS rn
  FROM focus_areas
) sub WHERE focus_areas.id = sub.id;
