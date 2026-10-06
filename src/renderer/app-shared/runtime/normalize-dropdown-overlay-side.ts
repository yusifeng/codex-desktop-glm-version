export type DropdownOverlaySide = "top" | "bottom";

/** Keeps only supported dropdown overlay side values. */
export function normalizeDropdownOverlaySide(value: string | null | undefined): DropdownOverlaySide | undefined {
  return value === "bottom" || value === "top" ? value : undefined;
}
