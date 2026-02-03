import { Pool } from "pg";
import type {
  DbBodyArea,
  DbExercise,
  DbFocusArea,
  FocusAreaSuggestion,
} from "./types";

interface FocusAreaRow extends DbFocusArea {
  body_area_name: string;
}

interface FulfillmentRow {
  body_area_id: number;
  pts_fulfilled: string;
}

interface LastDoneRow {
  body_area_id: number;
  last_ever: string | null;
}

export async function getSuggestions(
  pool: Pool,
  userId: number,
  activePlanId: number
): Promise<FocusAreaSuggestion[]> {
  // 1. Get focus areas for the active plan
  const focusResult = await pool.query<FocusAreaRow>(
    `SELECT fa.*, ba.name as body_area_name
     FROM focus_areas fa
     JOIN body_areas ba ON ba.id = fa.body_area_id
     WHERE fa.plan_id = $1`,
    [activePlanId]
  );
  const focusRows = focusResult.rows;

  if (focusRows.length === 0) return [];

  const bodyAreaIds = [...new Set(focusRows.map((r) => r.body_area_id))];

  // 2. Get pts fulfilled per body area within each area's rolling window
  // We need to compute this per focus area since each may have different period_length_days
  const fulfillmentByArea = new Map<number, number>();

  for (const fa of focusRows) {
    const result = await pool.query<FulfillmentRow>(
      `SELECT COALESCE(SUM(s.pts), 0) as pts_fulfilled
       FROM sets s
       JOIN workouts w ON w.id = s.workout_id
       JOIN exercises e ON e.id = s.exercise_id
       WHERE w.user_id = $1
         AND w.finished = true
         AND w.completed_at >= NOW() - ($2 || ' days')::interval
         AND e.body_area_id = $3`,
      [userId, fa.period_length_days, fa.body_area_id]
    );
    fulfillmentByArea.set(
      fa.id,
      parseInt(result.rows[0]?.pts_fulfilled ?? "0", 10)
    );
  }

  // 3. Get days since last workout per body area (all time)
  const lastDoneResult = await pool.query<LastDoneRow>(
    `SELECT e.body_area_id, MAX(w.completed_at) as last_ever
     FROM sets s
     JOIN exercises e ON e.id = s.exercise_id
     JOIN workouts w ON w.id = s.workout_id
     WHERE w.user_id = $1 AND w.finished = true
       AND e.body_area_id = ANY($2)
     GROUP BY e.body_area_id`,
    [userId, bodyAreaIds]
  );
  const lastDoneMap = new Map<number, string | null>(
    lastDoneResult.rows.map((r) => [r.body_area_id, r.last_ever])
  );

  // 4. Get all exercises for the relevant body areas
  const exerciseResult = await pool.query<DbExercise>(
    `SELECT * FROM exercises WHERE body_area_id = ANY($1) ORDER BY body_area_id, name`,
    [bodyAreaIds]
  );
  const exercisesByArea = new Map<number, DbExercise[]>();
  for (const ex of exerciseResult.rows) {
    const list = exercisesByArea.get(ex.body_area_id) ?? [];
    list.push(ex);
    exercisesByArea.set(ex.body_area_id, list);
  }

  // 5. Compute suggestions
  const now = Date.now();
  const suggestions: FocusAreaSuggestion[] = focusRows.map((fa) => {
    const ptsFulfilled = fulfillmentByArea.get(fa.id) ?? 0;
    const lastEver = lastDoneMap.get(fa.body_area_id);

    let daysSinceLast: number | null = null;
    if (lastEver) {
      daysSinceLast = (now - new Date(lastEver).getTime()) / (1000 * 60 * 60 * 24);
      daysSinceLast = Math.round(daysSinceLast * 10) / 10;
    }

    const fulfillmentFraction = ptsFulfilled / fa.pts_per_period;
    const unfulfilled = Math.max(0, 1 - fulfillmentFraction);

    let overdueFraction: number;
    if (daysSinceLast === null) {
      overdueFraction = 2.0;
    } else {
      overdueFraction = Math.max(
        0,
        (daysSinceLast - fa.period_length_days) / fa.period_length_days
      );
    }

    const priority = unfulfilled * 2 + overdueFraction * 3;

    const bodyArea: DbBodyArea = {
      id: fa.body_area_id,
      name: fa.body_area_name,
    };

    return {
      focusArea: {
        id: fa.id,
        bodyArea,
        ptsPerPeriod: fa.pts_per_period,
        ptsType: fa.pts_type,
        periodLengthDays: fa.period_length_days,
      },
      ptsFulfilled,
      daysSinceLast: daysSinceLast !== null ? Math.round(daysSinceLast) : null,
      overdueFraction: Math.round(overdueFraction * 100) / 100,
      fulfillmentFraction: Math.round(fulfillmentFraction * 100) / 100,
      priority: Math.round(priority * 100) / 100,
      exercises: exercisesByArea.get(fa.body_area_id) ?? [],
    };
  });

  // 6. Sort by priority descending
  suggestions.sort((a, b) => b.priority - a.priority);

  return suggestions;
}
