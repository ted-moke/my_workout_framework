import styles from "./PointCubes.module.css";

interface Props {
  fulfilled: number;
  goal: number;
  color: string;
  unit?: number;
  size?: "small" | "large";
  newPts?: number;
}

export default function PointCubes({ fulfilled, goal, color, unit = 1, size = "large", newPts = 0 }: Props) {
  const priorFulfilled = fulfilled - newPts;
  const priorCubes = Math.floor(Math.min(priorFulfilled, goal) / unit);
  const newCubes = Math.floor(Math.min(fulfilled, goal) / unit) - priorCubes;
  const remainingCubes = Math.ceil(Math.max(goal - fulfilled, 0) / unit);
  const bonusCubes = Math.floor(Math.max(fulfilled - goal, 0) / unit);

  return (
    <div className={styles.grid} data-size={size}>
      {Array.from({ length: priorCubes }, (_, i) => (
        <span key={`p-${i}`} className={styles.filled} style={{ background: color }} />
      ))}
      {Array.from({ length: newCubes }, (_, i) => (
        <span key={`n-${i}`} className={styles.new} style={{ borderColor: color, color }} />
      ))}
      {Array.from({ length: remainingCubes }, (_, i) => (
        <span key={`r-${i}`} className={styles.remaining} style={{ borderColor: color }} />
      ))}
      {Array.from({ length: bonusCubes }, (_, i) => (
        <span key={`b-${i}`} className={styles.over} style={{ color }}></span>
      ))}
    </div>
  );
}
