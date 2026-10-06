export type AnnotationOrigin = "diff" | "browser" | "pdf" | "artifact_annotation";

/** Keeps only origins supported by the annotation surface. */
export function normalizeAnnotationOrigin(value: { origin?: string | null } | null | undefined): AnnotationOrigin | null {
  const origin = value?.origin;
  return origin === "diff" || origin === "browser" || origin === "pdf" || origin === "artifact_annotation" ? origin : null;
}
