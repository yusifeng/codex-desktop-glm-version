/** Return whether a query string contains the expected value for a parameter. */
export function hasQueryParamValue(search: string, parameter: string, expected: string): boolean {
  return new URLSearchParams(search).get(parameter) === expected;
}
