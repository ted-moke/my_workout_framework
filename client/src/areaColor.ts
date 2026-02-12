export const PALETTE_SIZE = 12;
const assignedColors = new Map<string, number>();

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return ((h % PALETTE_SIZE) + PALETTE_SIZE) % PALETTE_SIZE;
}

export function registerAreaColor(name: string, colorIndex: number): void {
  assignedColors.set(name, colorIndex % PALETTE_SIZE);
}

export function colorIndexToVar(colorIndex: number): string {
  return `var(--area-color-${colorIndex % PALETTE_SIZE})`;
}

export function areaColorVar(name: string): string {
  let slot = assignedColors.get(name);
  if (slot === undefined) {
    slot = hashName(name);
    assignedColors.set(name, slot);
  }
  return `var(--area-color-${slot})`;
}
