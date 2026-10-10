-- Optional weight and reps on each logged exercise (set). Both nullable, so
-- existing sets are untouched and an exercise can still be logged with neither.
ALTER TABLE sets ADD COLUMN IF NOT EXISTS weight NUMERIC(7, 2);
ALTER TABLE sets ADD COLUMN IF NOT EXISTS reps INT;

DO $$
BEGIN
  ALTER TABLE sets ADD CONSTRAINT sets_weight_check CHECK (weight IS NULL OR weight >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE sets ADD CONSTRAINT sets_reps_check CHECK (reps IS NULL OR reps >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
