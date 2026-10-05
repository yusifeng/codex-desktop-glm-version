function parseNumstatValue(value: string) { if (value === `-`) return null; const parsed = Number.parseInt(value, 10); return Number.isNaN(parsed) ? null : parsed; }
export { parseNumstatValue };
if (typeof module !== `undefined`) module.exports = { parseNumstatValue };
