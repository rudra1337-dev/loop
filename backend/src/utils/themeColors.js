// A small, fixed palette so newly AI-created themes get a reasonable,
// visually-distinct color without ever trusting the AI to produce a good
// hex value itself (it won't reliably avoid clashing colors or invalid
// formats). Cycles by index so themes created later in a workspace still
// get visual variety instead of all defaulting to the same fallback color.
const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#ef4444', '#84cc16',
];

export function getNextThemeColor(existingThemeCount) {
  return PALETTE[existingThemeCount % PALETTE.length];
}