/**
 * X-29 Outcome Color Utilities (features/outcome/utils/outcomeColors.ts)
 */

export const PROGRAM_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#14b8a6', // teal
  '#f97316', // orange
];

export function getOutcomeProgramColor(programName: string): string {
  if (!programName) return '#eab308';
  let hash = 0;
  for (let i = 0; i < programName.length; i++) {
    hash = programName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PROGRAM_PALETTE.length;
  return PROGRAM_PALETTE[index];
}
