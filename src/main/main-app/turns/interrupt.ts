function errorText(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === `string`) return value;
  if (typeof value === `object` && value !== null && `message` in value && typeof value.message === `string`) return value.message;
  return String(value);
}

export function hy(value: unknown): string | null {
  const text = errorText(value);
  return text.match(/expected active turn id `?[^`\s]+`? but found `?([^`\s]+)`?/)?.[1] ??
    text.match(/ExpectedTurnMismatch\s*\{[^}]*actual:\s*"([^"]+)"/)?.[1] ?? null;
}

export const parseExpectedTurnMismatchActualId = hy;
