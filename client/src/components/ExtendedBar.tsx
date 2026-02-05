import styles from "./ExtendedBar.module.css";

interface Props {
  fraction: number;
  color: string;
}

export default function ExtendedBar({ fraction, color }: Props) {
  const isOver = fraction > 1;
  const scale = isOver ? fraction * 1.15 : 1;
  const fillPct = (fraction / scale) * 100;
  const goalPct = (1 / scale) * 100;

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div
          className={styles.fill}
          style={{
            width: `${isOver ? goalPct : fillPct}%`,
            background: color,
          }}
        />
        {isOver && (
          <div
            className={styles.fill}
            style={{
              width: `${fillPct - goalPct}%`,
              background: color,
              opacity: 0.4,
            }}
          />
        )}
      </div>
      <div
        className={styles.goal}
        style={{ left: `${goalPct}%` }}
      />
    </div>
  );
}
