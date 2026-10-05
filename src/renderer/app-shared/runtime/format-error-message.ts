/** Normalize unknown thrown values into a user-displayable message. */
export function formatErrorMessage(value: unknown): string | undefined {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value != null && "message" in value) {
    const message = value.message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
