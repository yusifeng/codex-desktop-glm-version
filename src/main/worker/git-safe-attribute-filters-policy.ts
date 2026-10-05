/** Pure safe Git attribute filter discovery and override construction policy. */

export const filterConfigPattern = `^filter\\..*\\.(clean|smudge|process|required)$`;
export const baseAttributeOverrides = [`-c`, `attr.tree=`, `-c`, `core.attributesFile=`];

export function parseFilterDriverName(configKey: string) {
  return /^filter\.(.+)\.(?:clean|smudge|process|required)$/.exec(configKey)?.[1] ?? null;
}

export function createSafeAttributeFilterOverrides(configOutput: string) {
  const driverNames = new Set<string>();
  for (const line of configOutput.split(/\r?\n/)) {
    const name = parseFilterDriverName(line.trim());
    if (name != null) driverNames.add(name);
  }
  return [
    ...baseAttributeOverrides,
    ...[...driverNames].flatMap((name) => [
      `-c`, `filter.${name}.clean=`, `-c`, `filter.${name}.smudge=`,
      `-c`, `filter.${name}.process=`, `-c`, `filter.${name}.required=false`,
    ]),
  ];
}

if (typeof module !== `undefined`) module.exports = { baseAttributeOverrides, createSafeAttributeFilterOverrides, filterConfigPattern, parseFilterDriverName };
