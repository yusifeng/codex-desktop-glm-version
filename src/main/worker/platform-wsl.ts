/** Pure WSL command-output parsing extracted from the worker platform layer. */

export function decodeCommandOutput(value: unknown): string {
  let text: string;
  if (Buffer.isBuffer(value)) {
    if (value.length === 0) return "";
    if (value.length >= 2 && value[0] === 255 && value[1] === 254) text = value.subarray(2).toString("utf16le");
    else if (value.length >= 3 && value[0] === 239 && value[1] === 187 && value[2] === 191) text = value.subarray(3).toString("utf8");
    else {
      const sampleLength = Math.min(value.length - (value.length % 2), 256);
      let nulCount = 0;
      for (let index = 0; index < sampleLength; index += 2) if (value[index + 1] === 0) nulCount++;
      text = sampleLength > 0 && nulCount / (sampleLength / 2) > 0.6 ? value.toString("utf16le") : value.toString("utf8");
    }
  } else text = String(value ?? "");
  return text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
}

export function findActiveDistro(value: string): string | null {
  const row = value.split("\n").map((line) => line.trim()).find((line) => line.startsWith("*"));
  return row?.slice(1).trim().split(/\s{2,}|\t+/)[0] ?? null;
}

export function orderEligibleDistros(value: string): string[] {
  const active = findActiveDistro(value);
  const distros = value.split("\n").slice(1)
    .map((line) => line.replace(/^\s*\*?\s*/, "").split(/\s{2,}|\t+/))
    .filter(([, , state]) => state === "2")
    .map(([name]) => name)
    .filter((name): name is string => name != null);
  return active == null || !distros.includes(active) ? distros : [active, ...distros.filter((name) => name !== active)];
}

module.exports = { decodeCommandOutput, findActiveDistro, orderEligibleDistros };
