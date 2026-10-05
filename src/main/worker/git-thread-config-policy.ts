/** Pure JSON/schema projection policy for thread configuration. */

export function parseThreadConfigValue(
  value: string,
  parseSchema: (value: unknown) => { success: boolean; data?: any; error?: { message?: string } },
) {
  try {
    const parsed = parseSchema(JSON.parse(value));
    return parsed.success
      ? { success: true, data: parsed.data }
      : { success: false, error: parsed.error?.message ?? null };
  } catch (error) {
    return { success: false, error };
  }
}

if (typeof module !== `undefined`) module.exports = { parseThreadConfigValue };
