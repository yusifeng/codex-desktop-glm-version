/**
 * Projects annotation selection/hover state into the inline style consumed by
 * the generated annotation overlay.  The helper is intentionally pure: the
 * generated hub owns React/lifecycle wiring while this module preserves the
 * deterministic style contract.
 */
export interface AnnotationSelectionStyleOptions {
  appearance?: "selection" | "hover" | string;
  fillOnly?: boolean;
  borderWidthPx?: number;
  borderColor?: string;
  fillColor?: string;
  shadow?: boolean;
  zoomScale?: number;
}

export function getAnnotationSelectionStyle({
  appearance = "selection",
  fillOnly = false,
  borderWidthPx = 2,
  borderColor = "var(--color-token-text-link-foreground, #339cff)",
  fillColor = "color-mix(in srgb, var(--color-token-text-link-foreground, #339cff) 10%, transparent)",
  shadow = !fillOnly,
  zoomScale = 1,
}: AnnotationSelectionStyleOptions = {}): Record<string, string | number> {
  const scale = 1 / Math.max(zoomScale, 2 ** -52);
  if (appearance === "hover") {
    return {
      backgroundColor: "transparent",
      borderStyle: "solid",
      borderWidth: 2.25 * scale,
      borderColor: "#2563eb",
      boxShadow: "none",
    };
  }
  return {
    backgroundColor: fillColor,
    borderStyle: fillOnly ? "none" : "dashed",
    borderWidth: fillOnly ? 0 : borderWidthPx * scale,
    borderRadius: 0,
    borderColor,
    boxShadow: fillOnly || !shadow ? "none" : `inset 0 0 0 ${scale}px rgba(255,255,255,0.28)`,
  };
}
