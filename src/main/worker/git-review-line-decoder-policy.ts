function createLineDecoder(onLine: (line: string) => void) {
  const decoder = new TextDecoder(); let pending = ``;
  return (chunk: Uint8Array) => {
    pending += decoder.decode(chunk, { stream: true });
    for (;;) { const index = pending.indexOf(`\n`); if (index === -1) break; const line = pending.slice(0, index); pending = pending.slice(index + 1); onLine(line); }
  };
}
export { createLineDecoder };
if (typeof module !== `undefined`) module.exports = { createLineDecoder };
