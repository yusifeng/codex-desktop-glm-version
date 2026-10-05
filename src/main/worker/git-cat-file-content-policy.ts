function splitContentLines(content: string) {
  const lines = content.split(/(?<=\n)/);
  if (lines.length === 1 && lines[0] === ``) return [];
  if (lines.at(-1) === ``) lines.pop();
  return lines;
}
export { splitContentLines };
if (typeof module !== `undefined`) module.exports = { splitContentLines };
