export interface ActiveStateReader<T> {
  getState(value: T): { active?: boolean } | undefined;
}

/** Check the generated entity registry's active flag without exposing registry details. */
export function isActiveEntity<T>(registry: ActiveStateReader<T>, value: T): boolean {
  return registry.getState(value)?.active === true;
}
