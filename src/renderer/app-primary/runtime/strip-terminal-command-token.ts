const FORBIDDEN_TOKEN_CHARACTERS = new Set(["~", "^", ":", "?", "*", "[", "]", "\\"]);

/** Remove whitespace and shell-special characters from a terminal token. */
export function stripTerminalCommandToken(value: string): string {
  return Array.from(value).filter((character) => !/\s/u.test(character) && !FORBIDDEN_TOKEN_CHARACTERS.has(character)).join("");
}
