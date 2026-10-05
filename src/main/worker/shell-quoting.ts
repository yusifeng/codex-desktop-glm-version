export function isShellSafeToken(value: string): boolean {
  return value !== `` && /^[\w@%\-+=:,./]+$/.test(value);
}
export function quoteShellArg(value: string): string {
  return value === ``
    ? `''`
    : !isShellSafeToken(value)
      ? (`'${value.replace(/('+)/g, `\"$1\"`)}'`).replace(/^''|''$/g, ``)
      : value;
}

export function joinShellArgs(args: string[]): string {
  if (!Array.isArray(args)) throw TypeError(`args should be an array`);
  return args.map(quoteShellArg).join(` `);
}

if (typeof module !== `undefined`) module.exports = { isShellSafeToken, quoteShellArg, joinShellArgs };
