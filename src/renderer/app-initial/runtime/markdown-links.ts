export interface MarkdownLink {
  end: number;
  label: string;
  path: string;
  start: number;
}

/** Remove Markdown punctuation escapes (former app-initial `qpn`/`Fm`). */
export function unescapeMarkdownPunctuation(value: string): string {
  return value.replace(/\\([!-/:-@[-`{-~])/g, "$1");
}

/** Find the next inline Markdown link without crossing a newline (former app-initial `Wpn`/`Im`). */
export function findNextMarkdownLink(value: string, fromIndex: number): MarkdownLink | null {
  let cursor = fromIndex;
  scanLinks: while (cursor < value.length) {
    const start = value.indexOf("[", cursor);
    if (start === -1) return null;
    let labelEnd = start + 1;
    while (labelEnd < value.length) {
      const character = value[labelEnd];
      const next = value[labelEnd + 1];
      if (character === "\n" || character === "\r") {
        cursor = labelEnd + 1;
        continue scanLinks;
      }
      if (
        character === "\\" &&
        (next === "\\" || (next === "]" && value[labelEnd + 2] !== "("))
      ) {
        labelEnd += 2;
        continue;
      }
      if (character === "]") break;
      labelEnd += 1;
    }
    if (labelEnd >= value.length) return null;
    if (labelEnd === start + 1 || value[labelEnd + 1] !== "(") {
      cursor = labelEnd + 1;
      continue;
    }
    let pathEnd = labelEnd + 2;
    while (pathEnd < value.length) {
      const character = value[pathEnd];
      if (character === "\n" || character === "\r") {
        cursor = pathEnd + 1;
        continue scanLinks;
      }
      const next = value[pathEnd + 1];
      if (character === "\\" && (next === "\n" || next === "\r")) {
        cursor = pathEnd + 2;
        continue scanLinks;
      }
      if (character === "\\" && next != null) {
        pathEnd += 2;
        continue;
      }
      if (character === ")") {
        if (pathEnd === labelEnd + 2) {
          cursor = pathEnd + 1;
          continue scanLinks;
        }
        return {
          end: pathEnd + 1,
          label: value.slice(start + 1, labelEnd),
          path: value.slice(labelEnd + 2, pathEnd),
          start,
        };
      }
      pathEnd += 1;
    }
    return null;
  }
  return null;
}
