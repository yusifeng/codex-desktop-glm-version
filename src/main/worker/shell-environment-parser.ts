/** Pure helpers for reading login-shell environment output. */
const ANSI_ESCAPE = /(?:\u001B\][\s\S]*?(?:\u0007|\u001B\\|\u009C)|[\u001B\u009B][[\]()#;?]*(?:\d{1,4}(?:[;:]\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~])/g;

export function parseShellEnvironmentOutput(output: string, delimiter: string, separator: string): Record<string, string> {
  const marker = separator === `\0` ? `\0${delimiter}\0` : delimiter;
  const [, body, trailer] = output.split(marker);
  if (body == null || trailer == null) throw new Error(`Shell output did not contain env delimiters`);
  const clean = separator === `\n` ? body.replace(ANSI_ESCAPE, ``) : body;
  const values: Record<string, string> = {};
  for (const line of clean.split(separator)) {
    const value = separator === `\n` ? line.trimEnd() : line;
    const index = value.indexOf(`=`);
    if (index > 0) values[value.slice(0, index)] = value.slice(index + 1);
  }
  return values;
}

export function getEnvironmentValue(environment: Record<string, string | undefined>, key: string): string | undefined {
  return Object.entries(environment).find(([name, value]) => name.toLowerCase() === key.toLowerCase() && value != null && value.length > 0)?.[1];
}

export { ANSI_ESCAPE };
if (typeof module !== `undefined`) module.exports = { ANSI_ESCAPE, parseShellEnvironmentOutput, getEnvironmentValue };
