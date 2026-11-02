/** Immutably set or clear one project's appearance selection. */
export function updateProjectAppearance<T>(input: {
  projectAppearances: Record<string, T>;
  projectId: string;
  appearance: T | null | undefined;
}): Record<string, T> {
  const result = { ...input.projectAppearances };
  if (input.appearance == null) delete result[input.projectId];
  else result[input.projectId] = input.appearance;
  return result;
}
