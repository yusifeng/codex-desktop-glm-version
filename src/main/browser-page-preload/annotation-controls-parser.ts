/** Parses serialized annotation controls payloads, including patch updates. */
function parseAnnotationControlsPayload(
  serialized: unknown,
  fullParse: (value: unknown) => { success: boolean; data?: unknown },
  patchParse: (value: unknown) => { success: boolean; data?: unknown },
  current?: Record<string, unknown>,
  maxLength = 16384,
): Record<string, unknown> | undefined {
  if (typeof serialized !== `string` || serialized.length > maxLength) return undefined;
  try {
    let value: unknown = JSON.parse(serialized);
    if (current != null) {
      const patch = patchParse(value);
      if (!patch.success) return undefined;
      value = { ...current, ...(patch.data as Record<string, unknown>) };
    }
    const parsed = fullParse(value);
    return parsed.success ? parsed.data as Record<string, unknown> : undefined;
  } catch {
    return undefined;
  }
}

export { parseAnnotationControlsPayload };
if (typeof module !== `undefined`) module.exports = { parseAnnotationControlsPayload };
