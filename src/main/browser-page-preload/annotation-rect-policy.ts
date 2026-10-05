function isValidAnnotationRect(value: unknown): value is { x: number; y: number; width: number; height: number } {
  if (value == null || typeof value !== `object`) return false;
  const rect = value as Record<string, unknown>;
  return typeof rect.x === `number` && Number.isFinite(rect.x) && typeof rect.y === `number` && Number.isFinite(rect.y) && typeof rect.width === `number` && Number.isFinite(rect.width) && rect.width > 0 && typeof rect.height === `number` && Number.isFinite(rect.height) && rect.height > 0;
}

export { isValidAnnotationRect };
if (typeof module !== `undefined`) module.exports = { isValidAnnotationRect };
