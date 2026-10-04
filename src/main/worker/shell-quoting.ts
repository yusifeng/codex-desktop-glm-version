export function quoteShellArg(value: string): string {
  return value === ``
    ? `''`
    : /[^\w@%\-+=:,./]/.test(value)
      ? (`'${value.replace(/('+)/g, `\"$1\"`)}'`).replace(/^''|''$/g, ``)
      : value;
}

export function joinShellArgs(args: string[]): string {
  if (!Array.isArray(args)) throw TypeError(`args should be an array`);
  return args.map(quoteShellArg).join(` `);
}

if (typeof module !== `undefined`) module.exports = { quoteShellArg, joinShellArgs };
