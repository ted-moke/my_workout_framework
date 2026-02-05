import styles from "./PointCubes.module.css";

interface Props {
  fulfilled: number;
  goal: number;
  color: string;
  unit?: number;
  size? : "small" | "large";
}

export default function PointCubes({ fulfilled, goal, color, unit = 1, size = "large" }: Props) {
  const filledCubes = Math.floor(Math.min(fulfilled, goal) / unit);
  const remainingCubes = Math.ceil(Math.max(goal - fulfilled, 0) / unit);
  const bonusCubes = Math.floor(Math.max(fulfilled - goal, 0) / unit);

  return (
    <div className={styles.grid} data-size={size}>
      {Array.from({ length: filledCubes }, (_, i) => (
        <span key={`f-${i}`} className={styles.filled} style={{ background: color }} />
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
