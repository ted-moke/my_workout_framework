const PALETTE_SIZE = 12;
const assignedColors = new Map<string, number>();
let nextSlot = 0;

export function areaColorVar(name: string): string {
  let slot = assignedColors.get(name);
  if (slot === undefined) {
    slot = nextSlot % PALETTE_SIZE;
    assignedColors.set(name, slot);
    nextSlot++;
  }
  return `var(--area-color-${slot})`;
}
