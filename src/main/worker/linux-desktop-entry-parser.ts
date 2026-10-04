/** Parse the stable key/value portion of a freedesktop desktop entry. */
export function parseDesktopEntryFields(content: string): Map<string, string> {
  const fields = new Map<string, string>();
  let inDesktopEntry = false;
  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (line.startsWith(`[`) && line.endsWith(`]`)) {
      inDesktopEntry = line === `[Desktop Entry]`;
      continue;
    }
    if (!inDesktopEntry || line.startsWith(`#`)) continue;
    const separator = line.indexOf(`=`);
    if (separator > 0) fields.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }
  return fields;
}
if (typeof module !== `undefined`) module.exports = { parseDesktopEntryFields };
