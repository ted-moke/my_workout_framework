import { FiX } from "react-icons/fi";
import type { PtsType } from "../types";

interface Props {
  pts: number;
  ptsType: PtsType;
  onRemove: () => void;
  disabled?: boolean;
}

export default function SetBadge({ pts, ptsType, onRemove, disabled }: Props) {
  const label = ptsType === "active_minutes" ? `${pts}m` : `${pts}pt`;

  return (
    <span className="set-badge">
      <span className="set-badge-value">{label}</span>
      <button
        className="set-badge-remove"
        onClick={onRemove}
        disabled={disabled}
        title="Remove set"
      >
        <FiX />
      </button>
    </span>
  );
}
