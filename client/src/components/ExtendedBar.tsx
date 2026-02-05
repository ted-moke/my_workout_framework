import styles from "./ExtendedBar.module.css";

interface Props {
  fraction: number;
  color: string;
}

export default function ExtendedBar({ fraction, color }: Props) {
  const basePct = Math.min(fraction, 1) * 100;
  const overPct = Math.min(Math.max(fraction - 1, 0), 1) * 100;

  return (
    <div className={styles.bar}>
      <div
        className={styles.base}
        style={{ width: `${basePct}%`, background: color }}
      />
      {overPct > 0 && (
        <div
          className={styles.over}
          style={{ width: `${overPct}%`, background: color }}
        />
      )}
    </div>
  );
}
