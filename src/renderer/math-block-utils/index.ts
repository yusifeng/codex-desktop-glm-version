let initialized = false;

function findUnescapedEquals(source: string): number[] {
  const positions: number[] = [];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "=" && source[index - 1] !== "\\") positions.push(index);
  }
  return positions;
}

const subscriptPattern = /(\\?[a-zA-Z]+)\s*_\s*(\{[^}]+\}|[a-zA-Z0-9]+)/g;

function analyzeSubscripts(source: string): {
  hasInvalidSubscript: boolean;
  numericSubscripts: Map<string, string>;
} {
  const numericSubscripts = new Map<string, string>();
  let hasInvalidSubscript = false;

  for (const match of source.matchAll(subscriptPattern)) {
    const command = match[1].replace(/^\\/, "").toLowerCase();
    const value = match[2].replace(/^\{\s*|\s*\}$/g, "").trim();
    if (command === "log") continue;
    if (!/^\d+$/.test(value)) {
      hasInvalidSubscript = true;
      continue;
    }
    numericSubscripts.set(`${command}_${value}`, value);
  }

  const remainder = source.replace(subscriptPattern, "$1");
  if (/(^|[^\\])_/.test(remainder)) hasInvalidSubscript = true;
  return { hasInvalidSubscript, numericSubscripts };
}

function initializeMathBlockUtils(): void {
  initialized = true;
}

initializeMathBlockUtils();
void initialized;

export {
  findUnescapedEquals as n,
  initializeMathBlockUtils as r,
  analyzeSubscripts as t,
};
